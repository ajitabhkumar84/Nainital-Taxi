-- ============================================================================
-- HARDEN RLS — third pass, from the 2026-08-28 audit
-- ============================================================================
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- Safe to re-run: every statement is guarded or idempotent.
--
-- This is the same class of gap harden_rls.sql (2026-07-31) and
-- harden_rls_new_tables.sql found, caught by auditing every CREATE TABLE in
-- supabase/ against every ALTER TABLE ... ENABLE ROW LEVEL SECURITY. Two
-- tables had never had RLS enabled anywhere, and one had RLS enabled but a
-- policy that hands the public anon key write access.
--
-- Why this keeps happening: Supabase grants anon + authenticated full CRUD by
-- default on new public-schema tables, so a table is exposed the moment it is
-- created unless the creating script remembers to lock it. The anon key ships
-- in every page's JS bundle, so "exposed" means anyone who views source can
-- write to it via the REST API.
--
-- Admin writes all use the service-role key (getAdminSupabaseClient), which
-- bypasses RLS entirely, so nothing here changes how the admin panel works.
-- It only blocks the public anon key.

-- ----------------------------------------------------------------------------
-- 1. addon_routes — created with no RLS at all
-- ----------------------------------------------------------------------------
-- Created by migrations/add_route_id_support.sql, which was written after
-- create_addons_schema.sql and mirrors its addon_packages /
-- addon_destinations junction tables. Those two were locked down in
-- harden_rls_new_tables.sql; addon_routes was created in a different file and
-- was missed, so it is currently the one addon junction table the anon key can
-- write to.
--
-- It is read publicly: /api/addons resolves which addons apply to a transfer
-- route by querying it with an anon-key client, so it needs a public SELECT
-- policy and not a bare lockout. No sensitive filter column, same as its two
-- siblings.
ALTER TABLE addon_routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON addon_routes;
CREATE POLICY "Public read" ON addon_routes FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- 2. tour_trust_section — created with no RLS at all
-- ----------------------------------------------------------------------------
-- create_tour_trust_section_schema.sql enables no RLS, unlike
-- create_trust_section_schema.sql's sibling table, which was hardened in
-- harden_rls_new_tables.sql. The anon key can therefore rewrite the "Why
-- Families Trust Us" heading, description and trust pillars shown on every
-- tour package page.
--
-- Read via the anon-key singleton in queries_enhanced.ts (getTourTrustSection
-- is one of the three deliberately uncached page-copy singletons), so it needs
-- public read. Filtered on is_published to match trust_section exactly.
ALTER TABLE tour_trust_section ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON tour_trust_section;
CREATE POLICY "Public read" ON tour_trust_section FOR SELECT USING (is_published = true);

-- ----------------------------------------------------------------------------
-- 3. multi_day_rental_page — RLS on, but the UPDATE policy is public
-- ----------------------------------------------------------------------------
-- create_multiday_rental_page.sql enables RLS and then creates:
--
--   CREATE POLICY "Authenticated users can update multi-day rental page"
--     ON multi_day_rental_page FOR UPDATE USING (true) WITH CHECK (true);
--
-- The name says authenticated, but the statement has no TO clause, and a
-- policy with no TO clause applies to PUBLIC. Combined with Supabase's default
-- UPDATE grant to anon, that lets the public anon key rewrite the entire
-- multi-day rental page — heading, body copy, pricing text, the lot.
--
-- The policy is also unnecessary. That page is only ever written by
-- /api/admin/multi-day-rental via getAdminSupabaseClient(), and the
-- service-role key bypasses RLS, so dropping the policy removes the exposure
-- without removing any capability. The public SELECT policy stays.
DROP POLICY IF EXISTS "Authenticated users can update multi-day rental page"
  ON multi_day_rental_page;

-- ----------------------------------------------------------------------------
-- Verify
-- ----------------------------------------------------------------------------
-- Every row should show rowsecurity = true.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('addon_routes', 'tour_trust_section', 'multi_day_rental_page')
ORDER BY tablename;

-- Should return exactly two rows, both SELECT, plus multi_day_rental_page's
-- own "Public can view multi-day rental page" SELECT policy. No UPDATE,
-- INSERT or DELETE policy should appear for any of these three tables.
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('addon_routes', 'tour_trust_section', 'multi_day_rental_page')
ORDER BY tablename, policyname;

-- Catch-all: any public table still missing RLS. Should return zero rows.
-- This is the check that would have caught all three findings above, and is
-- also section 1 of verify_launch_readiness.sql — run that file for the full
-- audit (anon write access, anon reads of customer data, indexes, DB size).
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND NOT rowsecurity
ORDER BY tablename;

-- Catch-all: any policy that grants a write command to PUBLIC or anon.
-- Should return zero rows. Admin writes go through the service-role key, which
-- bypasses RLS, so no write policy needs to exist for anon at all.
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd <> 'SELECT'
  AND (roles = '{public}' OR 'anon' = ANY (roles))
ORDER BY tablename, policyname;
