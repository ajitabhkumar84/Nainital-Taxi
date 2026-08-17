-- ============================================================================
-- LAUNCH READINESS VERIFICATION  —  READ ONLY
-- ============================================================================
--
-- Paste the whole file into the Supabase SQL Editor and run it. It writes
-- nothing, creates nothing and drops nothing: every statement is a SELECT.
-- Safe to run against production, and safe to re-run.
--
-- It answers, with evidence rather than assumption:
--   1. Is RLS actually enabled on every public table?
--   2. Can the anonymous key write to anything?
--   3. Can the anonymous key read the tables holding customer data?
--   4. Are the indexes the query layer depends on actually present?
--   5. Is any table publishing to Realtime? (should be none)
--   6. How big is the database, against the 500MB free-tier limit?
--
-- HOW TO READ THE OUTPUT
-- Each section returns a `status` column. Anything that is not 'PASS' needs
-- attention before pointing DNS at Vercel. Sections 1-3 are the security
-- gates; 4-6 are cost and performance.
--
-- Supabase runs each statement and shows the results one block at a time —
-- scroll through all six.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. RLS ENABLED ON EVERY PUBLIC TABLE
-- ----------------------------------------------------------------------------
-- Without RLS, the anon key (which ships in the browser bundle as
-- NEXT_PUBLIC_SUPABASE_ANON_KEY) can do anything the `anon` role is granted.
-- RLS is the only thing making that key safe to publish.
--
-- Expect: every row 'PASS'. Any 'FAIL — RLS DISABLED' is a launch blocker.
SELECT
  '1. RLS enabled' AS check_name,
  tablename,
  CASE WHEN rowsecurity THEN 'PASS' ELSE 'FAIL — RLS DISABLED' END AS status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity ASC, tablename;


-- ----------------------------------------------------------------------------
-- 2. NO WRITE POLICIES GRANTED TO anon
-- ----------------------------------------------------------------------------
-- Every write in this app goes through a server route using the service-role
-- key (src/lib/supabase/admin.ts), which bypasses RLS. The anon role should
-- therefore have SELECT policies only. An INSERT/UPDATE/DELETE/ALL policy
-- reachable by anon would let anyone with the public key modify site content
-- straight from a browser console.
--
-- Expect: zero rows. Any row returned is a launch blocker.
SELECT
  '2. anon write policy' AS check_name,
  tablename,
  policyname,
  cmd,
  roles,
  'FAIL — anon can write' AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd <> 'SELECT'
  AND (
    roles::text[] && ARRAY['anon', 'public']
    OR roles::text = '{public}'
  )
ORDER BY tablename, policyname;


-- ----------------------------------------------------------------------------
-- 3. CUSTOMER-DATA TABLES ARE NOT ANON-READABLE
-- ----------------------------------------------------------------------------
-- These hold personal data (names, phone numbers, travel dates) and internal
-- audit history. They are read only by admin routes using the service-role
-- key, so they should have NO policy reachable by anon — with RLS on and no
-- policy, the default is deny.
--
-- A SELECT policy here would expose your entire enquiry and booking list to
-- anyone who opens devtools, which is both a customer-trust problem and a
-- personal-data one.
--
-- Expect: every row 'PASS (default-deny)'.
WITH sensitive(tablename) AS (
  VALUES
    ('contact_enquiries'),
    ('bookings'),
    ('booking_addons'),
    ('booking_status_history'),
    ('admin_audit_log'),
    ('ticker_bookings'),
    ('waitlist')
)
SELECT
  '3. customer data private' AS check_name,
  s.tablename,
  COALESCE(p.policyname, '(none)') AS anon_readable_policy,
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM pg_tables t
                     WHERE t.schemaname = 'public' AND t.tablename = s.tablename)
      THEN 'SKIP — table does not exist'
    WHEN p.policyname IS NULL THEN 'PASS (default-deny)'
    ELSE 'FAIL — anon can read customer data'
  END AS status
FROM sensitive s
LEFT JOIN pg_policies p
  ON p.schemaname = 'public'
 AND p.tablename = s.tablename
 AND p.cmd IN ('SELECT', 'ALL')
 AND (p.roles::text[] && ARRAY['anon', 'public'] OR p.roles::text = '{public}')
ORDER BY s.tablename;


-- ----------------------------------------------------------------------------
-- 4. INDEXES THE QUERY LAYER DEPENDS ON
-- ----------------------------------------------------------------------------
-- These back the lookups in src/lib/supabase/queries_enhanced.ts. Caching now
-- means they run far less often, but a slug lookup still runs on every cache
-- miss and on every fresh dynamic page.
--
-- Expect: every row 'PASS'. A 'MISSING' is not a launch blocker at this data
-- volume (tens of rows per table), but it will matter as content grows.
WITH expected(tablename, indexname) AS (
  VALUES
    ('destinations',  'idx_destinations_slug'),
    ('packages',      'idx_packages_slug'),
    ('packages',      'idx_packages_active'),
    ('pricing',       'idx_pricing_package'),
    ('routes',        'idx_routes_slug'),
    ('routes',        'idx_routes_active'),
    ('route_pricing', 'idx_route_pricing_route'),
    ('seasons',       'idx_seasons_dates'),
    ('availability',  'idx_availability_date'),
    ('reviews',       'idx_reviews_approved'),
    ('vehicles',      'idx_vehicles_active'),
    ('temples',       'idx_temples_slug')
)
SELECT
  '4. index present' AS check_name,
  e.tablename,
  e.indexname,
  CASE WHEN i.indexname IS NOT NULL THEN 'PASS' ELSE 'MISSING' END AS status
FROM expected e
LEFT JOIN pg_indexes i
  ON i.schemaname = 'public'
 AND i.tablename = e.tablename
 AND i.indexname = e.indexname
ORDER BY status DESC, e.tablename, e.indexname;


-- ----------------------------------------------------------------------------
-- 5. REALTIME PUBLICATION IS EMPTY
-- ----------------------------------------------------------------------------
-- The free tier allows 200 concurrent Realtime connections. This app opens
-- none — there is no .channel()/.subscribe() anywhere, and the CSP in
-- src/lib/security/csp.ts has no wss://*.supabase.co in connect-src, so the
-- browser would block a Realtime socket even if some future code tried to
-- open one.
--
-- A table listed here isn't consuming connections on its own (broadcasting
-- only costs something once a client subscribes), but there is no reason for
-- one to be published, so an entry means something was enabled by accident.
--
-- Expect: zero rows.
-- To remove one:  ALTER PUBLICATION supabase_realtime DROP TABLE <tablename>;
SELECT
  '5. realtime publication' AS check_name,
  schemaname,
  tablename,
  'REVIEW — publishing to Realtime' AS status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;


-- ----------------------------------------------------------------------------
-- 6. DATABASE SIZE AGAINST THE 500MB FREE-TIER LIMIT
-- ----------------------------------------------------------------------------
-- Content rows here are small; this should read in the low single-digit MB.
-- If it is unexpectedly large the cause is almost always a table accumulating
-- rows without cleanup rather than the content itself.
--
-- Note the quota you are actually likely to hit first is EGRESS (5GB/month),
-- which is not visible from SQL — check it at
-- Supabase Dashboard -> Settings -> Usage. It is driven by images served from
-- Supabase Storage, not by these tables.
SELECT
  '6. database size' AS check_name,
  pg_size_pretty(pg_database_size(current_database())) AS total_size,
  CASE
    WHEN pg_database_size(current_database()) > 400 * 1024 * 1024
      THEN 'WARN — approaching 500MB free-tier limit'
    ELSE 'PASS'
  END AS status;

-- Largest tables, for when the number above is surprising.
SELECT
  '6b. largest tables' AS check_name,
  relname AS tablename,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY pg_total_relation_size(c.oid) DESC
LIMIT 10;
