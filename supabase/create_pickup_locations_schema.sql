-- ============================================================================
-- PICKUP LOCATIONS SCHEMA
-- ============================================================================
-- Admin-manageable list of pickup locations, replacing the hardcoded
-- PICKUP_LOCATIONS array that used to live in src/lib/pickupLocations.ts.
-- Modeled on create_route_categories_schema.sql.
--
-- routes.pickup_location / routes.drop_location remain plain TEXT columns
-- (no FK to this table) — intentional, not an oversight: drop_location is
-- free text today, and existing routes must keep working even if their
-- exact string doesn't match a row here (e.g. after a rename — see the
-- admin PATCH handler, which folds the old name into `aliases`).
-- ============================================================================

CREATE TABLE IF NOT EXISTS pickup_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Canonical display name (e.g., "Delhi", "Pantnagar Airport").
  name VARCHAR(100) NOT NULL UNIQUE,

  -- EXTRA legacy/alternate spellings only — do NOT repeat `name` itself
  -- here. Callers always treat [name, ...aliases] as the full match set.
  aliases TEXT[] NOT NULL DEFAULT '{}',

  -- Display order (lower numbers appear first)
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pickup_locations_display_order ON pickup_locations(display_order);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_pickup_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pickup_locations_updated_at_trigger ON pickup_locations;
CREATE TRIGGER pickup_locations_updated_at_trigger
  BEFORE UPDATE ON pickup_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_pickup_locations_updated_at();

-- Row Level Security — enabled here, in the same file, so the table is
-- never briefly exposed without a policy (unlike route_categories, which
-- needed a separate harden_rls_new_tables.sql follow-up).
ALTER TABLE pickup_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON pickup_locations;
CREATE POLICY "Public read" ON pickup_locations FOR SELECT USING (is_active = true);
-- No insert/update/delete policy: writes only ever go through
-- getAdminSupabaseClient() (service role), which bypasses RLS — matches
-- route_categories / ticker_bookings.

-- Seed: the 3 existing canonical locations (with their real legacy
-- aliases, preserved exactly from the old src/lib/pickupLocations.ts, so
-- existing `routes` rows keep resolving) + the new Pantnagar Airport.
INSERT INTO pickup_locations (name, aliases, display_order, is_active)
VALUES
  ('Delhi', '{}', 1, true),
  ('Kathgodam Station', ARRAY['Kathgodam', 'Kathgodam Railway Station'], 2, true),
  ('Nainital', '{}', 3, true),
  ('Pantnagar Airport', '{}', 4, true)
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE pickup_locations IS 'Admin-manageable pickup/drop location options, consumed server-side by the homepage/landing-page Transfers booking widget and client-side by the admin route form.';
COMMENT ON COLUMN pickup_locations.name IS 'Canonical display name, e.g. "Pantnagar Airport". Always an implicit alias of itself.';
COMMENT ON COLUMN pickup_locations.aliases IS 'Extra legacy/alternate spellings this location should also match (does not repeat `name`). Automatically gains the previous name whenever this row is renamed.';
COMMENT ON COLUMN pickup_locations.display_order IS 'Sort order in dropdowns (lower = first).';

-- Verify:
-- SELECT name, aliases, display_order, is_active FROM pickup_locations ORDER BY display_order;
