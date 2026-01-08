-- =====================================================
-- Temple Database Schema for Nainital Taxi
-- Comprehensive temple information with taxi integration
-- =====================================================

-- =====================================================
-- 1. TEMPLE CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS temple_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name VARCHAR(100) NOT NULL,
  category_slug VARCHAR(100) NOT NULL UNIQUE,
  category_description TEXT,
  icon VARCHAR(50) DEFAULT 'temple', -- temple, om, shiva, shakti, lotus, mountain, star, heritage, custom
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TEMPLES TABLE (Main temple information)
-- =====================================================
CREATE TABLE IF NOT EXISTS temples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  subtitle VARCHAR(500),

  -- Location & Geography
  district VARCHAR(100) NOT NULL, -- Nainital, Almora, Champawat, Bageshwar, Pithoragarh, Udham Singh Nagar
  location_address TEXT,
  nearest_city VARCHAR(100),
  altitude INTEGER, -- in meters
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  google_maps_embed_url TEXT,
  distance_from_nainital INTEGER, -- in km
  distance_from_kathgodam INTEGER, -- in km

  -- Temple Classification
  temple_type VARCHAR(100) NOT NULL, -- Shiva, Shakti, Ashram, Heritage, Local, Pilgrimage
  category_id UUID REFERENCES temple_categories(id) ON DELETE SET NULL,

  -- SEO
  page_title VARCHAR(255),
  meta_description TEXT,
  keywords TEXT[],

  -- Media
  featured_image_url TEXT,
  hero_images TEXT[], -- Array of image URLs for hero slider
  video_embed_url TEXT, -- YouTube/Vimeo embed URL
  gallery_images TEXT[], -- Additional gallery images

  -- Content
  intro_text TEXT,
  history TEXT,
  significance TEXT,
  highlights TEXT[], -- Array of key highlights

  -- Temple Details (JSONB for flexibility)
  timings JSONB, -- { openTime, closeTime, poojaTimings[], closedDays[], specialNote }
  how_to_reach JSONB, -- { fromNainital, fromKathgodam, fromPantnagar, fromDelhi, nearestRailway, nearestAirport }

  -- Visiting Information
  best_time_to_visit VARCHAR(255),
  seasonal_events JSONB, -- [{ eventName, timing, description }]
  pilgrimage_tips TEXT[],
  accommodation_info TEXT,
  entry_fee VARCHAR(100),

  -- Custom Sections (flexible content blocks)
  custom_sections JSONB, -- [{ title, content, imageUrl }]

  -- Taxi Integration
  taxi_cta JSONB, -- { heading, subheading, primaryRouteId }

  -- Status & Display
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  show_on_homepage BOOLEAN DEFAULT false,
  popularity INTEGER DEFAULT 50, -- 1-100 ranking
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TEMPLE PRICING TABLE (Taxi services from Nainital)
-- =====================================================
CREATE TABLE IF NOT EXISTS temple_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temple_id UUID NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
  vehicle_type VARCHAR(50) NOT NULL, -- Sedan, SUV, Luxury Sedan, Tempo Traveller
  season_name VARCHAR(50) NOT NULL, -- Season, Off-Season
  price DECIMAL(10, 2) NOT NULL,
  round_trip_price DECIMAL(10, 2), -- Optional round trip pricing
  waiting_charges VARCHAR(100), -- e.g., "Rs 100/hour after 2 hours"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(temple_id, vehicle_type, season_name)
);

-- =====================================================
-- 4. TEMPLE RELATIONS (Many-to-Many)
-- =====================================================

-- Related Routes (taxi routes that connect to this temple)
CREATE TABLE IF NOT EXISTS temple_related_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temple_id UUID NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(temple_id, route_id)
);

-- Related Packages (tour packages that include this temple)
CREATE TABLE IF NOT EXISTS temple_related_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temple_id UUID NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(temple_id, package_id)
);

-- Nearby Temples (temples in proximity)
CREATE TABLE IF NOT EXISTS temple_nearby_temples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temple_id UUID NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
  nearby_temple_id UUID NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
  distance_km INTEGER, -- distance in km
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(temple_id, nearby_temple_id),
  CHECK (temple_id != nearby_temple_id) -- Prevent self-reference
);

-- Nearby Attractions (destinations near the temple)
CREATE TABLE IF NOT EXISTS temple_nearby_attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temple_id UUID NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  distance_km INTEGER, -- distance in km
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(temple_id, destination_id)
);

-- =====================================================
-- 5. TEMPLE FAQs
-- =====================================================
CREATE TABLE IF NOT EXISTS temple_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temple_id UUID NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. TEMPLES PAGE CONFIGURATION (Singleton)
-- =====================================================
CREATE TABLE IF NOT EXISTS temples_page_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- SEO
  page_title VARCHAR(255) NOT NULL DEFAULT 'Sacred Temples of Kumaon | Nainital Taxi',
  meta_description TEXT,
  keywords TEXT[],

  -- Hero Section
  hero_title VARCHAR(255) NOT NULL DEFAULT 'Sacred Temples of Kumaon',
  hero_subtitle TEXT,
  hero_badge VARCHAR(100),
  hero_image_url TEXT,

  -- Introduction
  intro_text TEXT,

  -- Filter Settings
  enable_district_filter BOOLEAN DEFAULT true,
  enable_type_filter BOOLEAN DEFAULT true,
  enable_search BOOLEAN DEFAULT true,

  -- Category Navigation
  show_category_navigation BOOLEAN DEFAULT true,

  -- Content Sections
  additional_info JSONB, -- [{ icon, title, description }]
  bottom_cta JSONB, -- { heading, subheading, primaryButtonText, primaryButtonLink, secondaryButtonText }

  -- Page FAQs
  page_faqs JSONB, -- [{ question, answer }]

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default temples page configuration
INSERT INTO temples_page_config (
  page_title,
  meta_description,
  hero_title,
  hero_subtitle,
  hero_badge,
  intro_text
) VALUES (
  'Sacred Temples of Kumaon Region | Nainital Taxi Services',
  'Explore 30+ sacred temples across Kumaon region including Nainital, Almora, Champawat. Book comfortable taxi services for your spiritual journey.',
  'Sacred Temples of Kumaon',
  'Discover divine destinations across 6 districts with comfortable taxi services',
  '30+ Sacred Sites',
  'The Kumaon region is blessed with numerous ancient temples, ashrams, and spiritual centers. From the globally renowned Kainchi Dham to hidden gems in remote valleys, each temple has its unique story and spiritual significance.'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. INDEXES for Performance
-- =====================================================

-- Temple indexes
CREATE INDEX idx_temples_slug ON temples(slug);
CREATE INDEX idx_temples_district ON temples(district);
CREATE INDEX idx_temples_temple_type ON temples(temple_type);
CREATE INDEX idx_temples_category_id ON temples(category_id);
CREATE INDEX idx_temples_is_active ON temples(is_active);
CREATE INDEX idx_temples_is_featured ON temples(is_featured);
CREATE INDEX idx_temples_display_order ON temples(display_order);
CREATE INDEX idx_temples_popularity ON temples(popularity DESC);

-- Category indexes
CREATE INDEX idx_temple_categories_slug ON temple_categories(category_slug);
CREATE INDEX idx_temple_categories_display_order ON temple_categories(display_order);

-- Pricing indexes
CREATE INDEX idx_temple_pricing_temple_id ON temple_pricing(temple_id);

-- Relation indexes
CREATE INDEX idx_temple_related_routes_temple_id ON temple_related_routes(temple_id);
CREATE INDEX idx_temple_related_packages_temple_id ON temple_related_packages(temple_id);
CREATE INDEX idx_temple_nearby_temples_temple_id ON temple_nearby_temples(temple_id);
CREATE INDEX idx_temple_nearby_attractions_temple_id ON temple_nearby_attractions(temple_id);

-- FAQ indexes
CREATE INDEX idx_temple_faqs_temple_id ON temple_faqs(temple_id);
CREATE INDEX idx_temple_faqs_display_order ON temple_faqs(display_order);

-- =====================================================
-- 8. UPDATE TIMESTAMP TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for temples
CREATE TRIGGER update_temples_updated_at
  BEFORE UPDATE ON temples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers for temple_categories
CREATE TRIGGER update_temple_categories_updated_at
  BEFORE UPDATE ON temple_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers for temple_pricing
CREATE TRIGGER update_temple_pricing_updated_at
  BEFORE UPDATE ON temple_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers for temple_faqs
CREATE TRIGGER update_temple_faqs_updated_at
  BEFORE UPDATE ON temple_faqs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers for temples_page_config
CREATE TRIGGER update_temples_page_config_updated_at
  BEFORE UPDATE ON temples_page_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. ROW LEVEL SECURITY (Optional - if needed)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE temple_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE temples ENABLE ROW LEVEL SECURITY;
ALTER TABLE temple_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE temple_related_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE temple_related_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE temple_nearby_temples ENABLE ROW LEVEL SECURITY;
ALTER TABLE temple_nearby_attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE temple_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE temples_page_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access (adjust as needed)
CREATE POLICY "Allow public read access" ON temple_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON temples FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read access" ON temple_pricing FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON temple_related_routes FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON temple_related_packages FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON temple_nearby_temples FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON temple_nearby_attractions FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON temple_faqs FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read access" ON temples_page_config FOR SELECT USING (is_active = true);

-- =====================================================
-- 10. SAMPLE DATA - Temple Categories
-- =====================================================

INSERT INTO temple_categories (category_name, category_slug, category_description, icon, display_order) VALUES
  ('Global Spiritual & Ashram Circuit', 'global-spiritual-ashram', 'World-renowned ashrams and spiritual centers that attract seekers from across the globe', 'om', 1),
  ('Shakti (Goddess) Powerhouses', 'shakti-powerhouses', 'Ancient temples dedicated to Divine Mother in her various forms', 'shakti', 2),
  ('Lord of Kailash - Shiva Temples', 'shiva-temples', 'Sacred abodes of Lord Shiva in the Himalayan foothills', 'shiva', 3),
  ('Gods of Justice & Local Legends', 'local-legends', 'Temples celebrating regional deities and folk traditions', 'temple', 4),
  ('Heritage & Architecture', 'heritage-architecture', 'Temples known for their historical significance and architectural beauty', 'heritage', 5),
  ('Corbett & Ramnagar Belt', 'corbett-ramnagar', 'Spiritual sites in the Corbett region', 'mountain', 6)
ON CONFLICT (category_slug) DO NOTHING;

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
--
-- To apply this schema:
-- 1. Connect to your Supabase project
-- 2. Go to SQL Editor
-- 3. Run this script
--
-- Next steps:
-- 1. Add TypeScript types to src/lib/supabase/types.ts
-- 2. Create admin API routes for CRUD operations
-- 3. Create admin forms and pages
-- 4. Create public temple listing and detail pages
-- =====================================================
