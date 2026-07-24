-- ============================================
-- Revenue Addons Feature - Database Schema
-- ============================================
-- This migration creates tables for the revenue addon feature
-- that allows customers to add optional upsells to their bookings

-- 1. Main Addons Table
-- Stores all available addons with season-based pricing
CREATE TABLE IF NOT EXISTS addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  image_url TEXT,
  icon_emoji VARCHAR(10),

  -- Visibility toggles
  show_before_booking BOOLEAN DEFAULT true,
  show_after_booking BOOLEAN DEFAULT false,

  -- Season-based pricing
  off_season_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  season_price DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Display & status
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_addons_active ON addons(is_active);
CREATE INDEX IF NOT EXISTS idx_addons_display_order ON addons(display_order);
CREATE INDEX IF NOT EXISTS idx_addons_slug ON addons(slug);

-- 2. Addon-Package Relationship
-- Maps which addons are available for which packages
CREATE TABLE IF NOT EXISTS addon_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(addon_id, package_id)
);

CREATE INDEX IF NOT EXISTS idx_addon_packages_addon ON addon_packages(addon_id);
CREATE INDEX IF NOT EXISTS idx_addon_packages_package ON addon_packages(package_id);

-- 3. Addon-Destination Relationship
-- Maps which addons are available for which destinations
CREATE TABLE IF NOT EXISTS addon_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(addon_id, destination_id)
);

CREATE INDEX IF NOT EXISTS idx_addon_destinations_addon ON addon_destinations(addon_id);
CREATE INDEX IF NOT EXISTS idx_addon_destinations_dest ON addon_destinations(destination_id);

-- 4. Booking Addons Junction Table
-- Stores which addons were selected for each booking with price snapshot
CREATE TABLE IF NOT EXISTS booking_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE RESTRICT,

  -- Price snapshot (historical protection)
  addon_name VARCHAR(255) NOT NULL,
  addon_price DECIMAL(10,2) NOT NULL,
  season_name VARCHAR(50) NOT NULL,

  -- Selection tracking
  selected_at_stage VARCHAR(20) NOT NULL, -- 'before_booking' or 'after_booking'

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_addons_booking ON booking_addons(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_addons_addon ON booking_addons(addon_id);

-- 5. Update Bookings Table
-- Add column to track total addon cost separately from base price
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings'
    AND column_name = 'addons_total'
  ) THEN
    ALTER TABLE bookings ADD COLUMN addons_total DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON TABLE addons IS 'Revenue-generating addons that can be added to bookings';
COMMENT ON TABLE addon_packages IS 'Maps addons to specific packages';
COMMENT ON TABLE addon_destinations IS 'Maps addons to specific destinations';
COMMENT ON TABLE booking_addons IS 'Junction table tracking which addons were selected for each booking';
COMMENT ON COLUMN bookings.addons_total IS 'Total cost of addons selected for this booking';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_addons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_update_addons_updated_at ON addons;
CREATE TRIGGER trigger_update_addons_updated_at
  BEFORE UPDATE ON addons
  FOR EACH ROW
  EXECUTE FUNCTION update_addons_updated_at();

-- Sample seed data (optional - comment out if not needed)
-- INSERT INTO addons (name, slug, short_description, icon_emoji, off_season_price, season_price, show_before_booking, is_featured, display_order) VALUES
-- ('Portable WiFi Device', 'portable-wifi', '4G WiFi hotspot for seamless connectivity', '📶', 250.00, 300.00, true, true, 1),
-- ('Child Car Seat', 'child-car-seat', 'Safety car seat for children', '👶', 150.00, 200.00, true, false, 2),
-- ('Boating Tickets', 'boating-tickets', 'Naini Lake boating experience', '🚣', 200.00, 250.00, true, true, 3),
-- ('Adventure Backpack', 'adventure-backpack', 'Waterproof backpack for trekking', '🎒', 300.00, 400.00, false, false, 4);
