-- ============================================================================
-- HARDEN RLS — for the tables created by the not-yet-applied migrations
-- ============================================================================
-- create_route_categories_schema.sql, create_ticker_bookings_schema.sql and
-- create_addons_schema.sql create their tables WITHOUT enabling RLS (same
-- gap as harden_rls.sql fixes for the tables already live). Run this file
-- right after running those three migrations, so the tables are never
-- briefly exposed to the public anon key.
--
-- (create_temples_schema.sql, create_multiday_rental_page.sql and
-- add_admin_audit_log.sql already enable RLS correctly themselves — no
-- follow-up needed for temples, multi_day_rental_page or admin_audit_log.)

-- route_categories: read via the anon-key server client in
-- /api/routes-with-categories — needs public read.
ALTER TABLE route_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON route_categories;
CREATE POLICY "Public read" ON route_categories FOR SELECT USING (is_active = true);

-- ticker_bookings: only ever read via getAdminSupabaseClient() (service
-- role) in /api/ticker — no public policy needed, matches admin_audit_log.
ALTER TABLE ticker_bookings ENABLE ROW LEVEL SECURITY;

-- trust_section: read via the anon-key client in queries_enhanced.ts for
-- the homepage "Why families trust us" section — needs public read.
ALTER TABLE trust_section ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON trust_section;
CREATE POLICY "Public read" ON trust_section FOR SELECT USING (is_published = true);

-- addons: read via an anon-key client in /api/addons — needs public read.
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON addons;
CREATE POLICY "Public read" ON addons FOR SELECT USING (is_active = true);

-- addon_packages / addon_destinations: junction tables queried by the same
-- public /api/addons route to resolve which addons apply to a
-- package/destination — need public read, no sensitive filter column.
ALTER TABLE addon_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON addon_packages;
CREATE POLICY "Public read" ON addon_packages FOR SELECT USING (true);

ALTER TABLE addon_destinations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON addon_destinations;
CREATE POLICY "Public read" ON addon_destinations FOR SELECT USING (true);

-- booking_addons: price-snapshot junction table for a specific booking —
-- only ever written server-side via the service-role key in
-- /api/bookings/create and /api/bookings/add-addons. No public policy.
ALTER TABLE booking_addons ENABLE ROW LEVEL SECURITY;

-- Verify: every row should now show rowsecurity = true.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('route_categories', 'ticker_bookings', 'trust_section',
                     'addons', 'addon_packages', 'addon_destinations', 'booking_addons')
ORDER BY tablename;
