-- ============================================================================
-- ROUTE CATEGORIES SCHEMA
-- ============================================================================
-- This schema adds route categories for better organization of routes on the
-- rates page, similar to the kathgodam-taxi implementation.
-- ============================================================================

-- Create route_categories table
CREATE TABLE IF NOT EXISTS route_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Category Information
  category_name VARCHAR(100) NOT NULL,
  category_slug VARCHAR(120) UNIQUE NOT NULL,
  category_description TEXT,

  -- Icon options: car, mountain, temple, city, lake, nature, road, custom
  icon VARCHAR(50) DEFAULT 'car',

  -- Display order (lower numbers appear first)
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add category_id to routes table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'routes' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE routes ADD COLUMN category_id UUID REFERENCES route_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index on category_id for better query performance
CREATE INDEX IF NOT EXISTS idx_routes_category_id ON routes(category_id);

-- Create index on display_order for sorting
CREATE INDEX IF NOT EXISTS idx_route_categories_display_order ON route_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_routes_display_order ON routes(display_order);

-- Update timestamp trigger for route_categories
CREATE OR REPLACE FUNCTION update_route_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS route_categories_updated_at_trigger ON route_categories;
CREATE TRIGGER route_categories_updated_at_trigger
  BEFORE UPDATE ON route_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_route_categories_updated_at();

-- Insert default categories
INSERT INTO route_categories (category_name, category_slug, category_description, icon, display_order)
VALUES
  ('Popular Destinations', 'popular-destinations', 'Most frequently booked routes from Nainital', 'mountain', 1),
  ('Hill Stations', 'hill-stations', 'Scenic hill station transfers', 'lake', 2),
  ('Temple Visits', 'temple-visits', 'Sacred temple pilgrimage routes', 'temple', 3),
  ('City Transfers', 'city-transfers', 'Railway station and airport transfers', 'city', 4),
  ('Weekend Getaways', 'weekend-getaways', 'Perfect for short trips', 'road', 5),
  ('Adventure Routes', 'adventure-routes', 'For thrill seekers and nature lovers', 'nature', 6)
ON CONFLICT (category_slug) DO NOTHING;

-- Create view for routes with category information
CREATE OR REPLACE VIEW routes_with_categories AS
SELECT
  r.*,
  rc.category_name,
  rc.category_slug AS category_slug_name,
  rc.icon AS category_icon,
  rc.display_order AS category_display_order
FROM routes r
LEFT JOIN route_categories rc ON r.category_id = rc.id
ORDER BY rc.display_order ASC NULLS LAST, r.display_order ASC;

COMMENT ON TABLE route_categories IS 'Categories for organizing routes on the rates page';
COMMENT ON COLUMN route_categories.category_name IS 'Display name of the category (e.g., "Popular Destinations")';
COMMENT ON COLUMN route_categories.category_slug IS 'URL-friendly slug (e.g., "popular-destinations")';
COMMENT ON COLUMN route_categories.icon IS 'Icon identifier: car, mountain, temple, city, lake, nature, road, custom';
COMMENT ON COLUMN route_categories.display_order IS 'Sort order on rates page (lower = first)';
