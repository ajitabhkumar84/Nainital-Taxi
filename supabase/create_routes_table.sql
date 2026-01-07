-- Migration: Create routes and route_pricing tables for transfer routes
-- This allows admin to define specific pickup-to-drop location pairs

-- ============================================================================
-- ROUTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Route Information
  slug TEXT UNIQUE NOT NULL,
  pickup_location TEXT NOT NULL,
  drop_location TEXT NOT NULL,

  -- Details
  distance INTEGER, -- in kilometers
  duration TEXT, -- e.g., "2 hours", "3.5 hours"
  description TEXT,

  -- Optional Features
  featured_package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  has_hotel_option BOOLEAN DEFAULT false,

  -- Destination Page Display
  show_on_destination_page BOOLEAN DEFAULT true,

  -- Status
  is_active BOOLEAN DEFAULT true,
  enable_online_booking BOOLEAN DEFAULT true,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Metadata
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_routes_pickup ON routes(pickup_location) WHERE is_active = true;
CREATE INDEX idx_routes_drop ON routes(drop_location) WHERE is_active = true;
CREATE INDEX idx_routes_active ON routes(is_active);
CREATE INDEX idx_routes_slug ON routes(slug);

-- Add comments
COMMENT ON TABLE routes IS 'Transfer routes with specific pickup and drop locations';
COMMENT ON COLUMN routes.slug IS 'URL-friendly identifier (e.g., delhi-to-nainital)';
COMMENT ON COLUMN routes.show_on_destination_page IS 'Whether to display this route on related destination pages';
COMMENT ON COLUMN routes.enable_online_booking IS 'Toggle to enable/disable online booking for this route';

-- ============================================================================
-- ROUTE PRICING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS route_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Route and vehicle combination
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('sedan', 'suv_normal', 'suv_deluxe', 'suv_luxury')),

  -- Season pricing (Off-Season or Season)
  season_name TEXT NOT NULL CHECK (season_name IN ('Off-Season', 'Season')),

  -- Price
  price INTEGER NOT NULL CHECK (price >= 0),

  -- Notes
  notes TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique combination
  UNIQUE(route_id, vehicle_type, season_name)
);

-- Add indexes
CREATE INDEX idx_route_pricing_route ON route_pricing(route_id);
CREATE INDEX idx_route_pricing_active ON route_pricing(is_active);

-- Add comments
COMMENT ON TABLE route_pricing IS 'Pricing for each route by vehicle type and season';
COMMENT ON COLUMN route_pricing.season_name IS 'Either Off-Season or Season';

-- ============================================================================
-- UPDATE TIMESTAMP TRIGGER
-- ============================================================================

-- Trigger for routes table
CREATE OR REPLACE FUNCTION update_routes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW
  EXECUTE FUNCTION update_routes_updated_at();

-- Trigger for route_pricing table
CREATE OR REPLACE FUNCTION update_route_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_route_pricing_updated_at
  BEFORE UPDATE ON route_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_route_pricing_updated_at();

-- ============================================================================
-- SAMPLE DATA (Optional - Remove if not needed)
-- ============================================================================

-- Sample Routes
INSERT INTO routes (slug, pickup_location, drop_location, distance, duration, description, is_active, enable_online_booking) VALUES
  ('delhi-to-nainital', 'Delhi', 'Nainital', 320, '7-8 hours', 'Comfortable transfer from Delhi to the beautiful hill station of Nainital', true, true),
  ('kathgodam-to-nainital', 'Kathgodam Railway Station', 'Nainital', 35, '1.5 hours', 'Quick and convenient transfer from Kathgodam Railway Station to Nainital', true, true),
  ('pantnagar-to-nainital', 'Pantnagar Airport', 'Nainital', 65, '2 hours', 'Airport pickup from Pantnagar to Nainital with professional drivers', true, true)
ON CONFLICT (slug) DO NOTHING;

-- Sample Pricing (for Delhi to Nainital route)
-- Get the route ID first
DO $$
DECLARE
  delhi_nainital_id UUID;
  kathgodam_nainital_id UUID;
BEGIN
  SELECT id INTO delhi_nainital_id FROM routes WHERE slug = 'delhi-to-nainital';
  SELECT id INTO kathgodam_nainital_id FROM routes WHERE slug = 'kathgodam-to-nainital';

  -- Delhi to Nainital pricing
  IF delhi_nainital_id IS NOT NULL THEN
    INSERT INTO route_pricing (route_id, vehicle_type, season_name, price) VALUES
      (delhi_nainital_id, 'sedan', 'Off-Season', 4500),
      (delhi_nainital_id, 'sedan', 'Season', 5000),
      (delhi_nainital_id, 'suv_normal', 'Off-Season', 5500),
      (delhi_nainital_id, 'suv_normal', 'Season', 6000),
      (delhi_nainital_id, 'suv_deluxe', 'Off-Season', 6500),
      (delhi_nainital_id, 'suv_deluxe', 'Season', 7000),
      (delhi_nainital_id, 'suv_luxury', 'Off-Season', 7500),
      (delhi_nainital_id, 'suv_luxury', 'Season', 8000)
    ON CONFLICT (route_id, vehicle_type, season_name) DO NOTHING;
  END IF;

  -- Kathgodam to Nainital pricing
  IF kathgodam_nainital_id IS NOT NULL THEN
    INSERT INTO route_pricing (route_id, vehicle_type, season_name, price) VALUES
      (kathgodam_nainital_id, 'sedan', 'Off-Season', 1200),
      (kathgodam_nainital_id, 'sedan', 'Season', 1500),
      (kathgodam_nainital_id, 'suv_normal', 'Off-Season', 1500),
      (kathgodam_nainital_id, 'suv_normal', 'Season', 1800),
      (kathgodam_nainital_id, 'suv_deluxe', 'Off-Season', 1800),
      (kathgodam_nainital_id, 'suv_deluxe', 'Season', 2100),
      (kathgodam_nainital_id, 'suv_luxury', 'Off-Season', 2100),
      (kathgodam_nainital_id, 'suv_luxury', 'Season', 2400)
    ON CONFLICT (route_id, vehicle_type, season_name) DO NOTHING;
  END IF;
END $$;
