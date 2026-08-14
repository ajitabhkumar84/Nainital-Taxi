-- =====================================================
-- Auto-reciprocating reverse routes
-- =====================================================
-- Links a generated "return" route back to the primary route it mirrors, so
-- the admin API can find it again on later saves instead of creating
-- duplicates.
--
-- Only *pricing*, is_active and enable_online_booking are mirrored on
-- subsequent saves — slug/description/meta_* are generated once at creation
-- and then belong to the admin (see src/lib/routeReverse.ts).
--
-- Apply by pasting this file into the Supabase SQL editor.
-- =====================================================

ALTER TABLE routes ADD COLUMN IF NOT EXISTS reverse_of_route_id UUID
  REFERENCES routes(id) ON DELETE SET NULL;

-- Deleting a primary leaves its reverse standing as an independent route
-- (ON DELETE SET NULL above) rather than cascading the deletion — the reverse
-- may already have bookings against it.

-- A primary has at most one generated reverse. Partial, so the many routes
-- with a NULL link don't collide with each other.
CREATE UNIQUE INDEX IF NOT EXISTS idx_routes_reverse_of
  ON routes(reverse_of_route_id) WHERE reverse_of_route_id IS NOT NULL;

-- A route can never be its own reverse.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'routes_reverse_not_self'
  ) THEN
    ALTER TABLE routes ADD CONSTRAINT routes_reverse_not_self
      CHECK (reverse_of_route_id IS NULL OR reverse_of_route_id <> id);
  END IF;
END $$;

COMMENT ON COLUMN routes.reverse_of_route_id IS
  'Set on an auto-generated return route, pointing at the primary it mirrors. NULL for ordinary/unlinked routes.';
