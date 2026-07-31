-- ============================================================================
-- HARDEN RLS — fixes tables that are live in production with RLS disabled
-- ============================================================================
-- Found 2026-07-31: admin_settings, routes, route_pricing and
-- booking_status_history were created without RLS. Supabase grants anon +
-- authenticated full CRUD by default on new public-schema tables, so with
-- RLS off, the public NEXT_PUBLIC_SUPABASE_ANON_KEY (shipped in every page's
-- JS bundle) can UPDATE/DELETE these tables directly via the REST API,
-- bypassing the admin password entirely. Confirmed live with a no-op
-- PATCH/DELETE (impossible filter, so no rows were touched) — both returned
-- 204, meaning the anon key currently has write access to route_pricing and
-- routes, and to admin_settings (which holds upi_id, whatsapp_number, and
-- the site_config_* content).
--
-- All admin writes already go through getAdminSupabaseClient() (the
-- service-role key), which bypasses RLS — so adding RLS here does not
-- change how the admin panel works. It only blocks the public anon key from
-- writing.

-- admin_settings: publicly read (site pages read business_phone, upi_id,
-- site_config_* directly), writes admin-only.
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON admin_settings;
CREATE POLICY "Public read" ON admin_settings FOR SELECT USING (true);

-- routes: publicly read active routes, writes admin-only.
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON routes;
CREATE POLICY "Public read" ON routes FOR SELECT USING (is_active = true);

-- route_pricing: publicly read active pricing, writes admin-only.
ALTER TABLE route_pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON route_pricing;
CREATE POLICY "Public read" ON route_pricing FOR SELECT USING (is_active = true);

-- booking_status_history: admin-only, no public policy at all (matches
-- admin_audit_log's pattern) — it's an internal audit trail, never read
-- from the client.
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;

-- Verify: every row should now show rowsecurity = true.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('admin_settings', 'routes', 'route_pricing', 'booking_status_history')
ORDER BY tablename;
