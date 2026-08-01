-- Run this manually against Supabase (SQL editor or CLI) before testing the
-- route-based transfer booking flow end-to-end.
--
-- bookings.package_id is FK'd to packages(id) (see schema_enhanced.sql).
-- Route-based transfers (BookingWidget's pickup/drop picker, backed by the
-- routes/route_pricing tables) previously stored a routes.id in that column,
-- which would violate the FK on insert. route_id gives route-based bookings
-- their own nullable FK instead of overloading package_id.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS route_id UUID REFERENCES routes(id);
CREATE INDEX IF NOT EXISTS idx_bookings_route ON bookings(route_id);

-- Addon-Route Relationship — mirrors addon_packages / addon_destinations
-- (see create_addons_schema.sql) so admins can map addons to specific
-- transfer routes instead of only tour packages/destinations.
CREATE TABLE IF NOT EXISTS addon_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(addon_id, route_id)
);

CREATE INDEX IF NOT EXISTS idx_addon_routes_addon ON addon_routes(addon_id);
CREATE INDEX IF NOT EXISTS idx_addon_routes_route ON addon_routes(route_id);

COMMENT ON COLUMN bookings.route_id IS 'Set for route-based transfer bookings (routes/route_pricing tables); package_id stays null for these rows.';
COMMENT ON TABLE addon_routes IS 'Maps addons to specific transfer routes';
