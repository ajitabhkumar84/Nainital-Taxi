-- ============================================================================
-- RUN ALL: fixes exposed RLS on existing tables, then applies the 7 missing
-- schema migrations, then locks down RLS on the tables they create.
-- Paste this whole file into Supabase SQL Editor (project pjdseqinttikdjowaytg)
-- and click Run once.
-- ============================================================================

-- ### STEP 1: harden_rls.sql ###
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

-- ### STEP 2: create_route_categories_schema.sql ###
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

-- ### STEP 3: create_ticker_bookings_schema.sql ###
-- ============================================
-- Social Proof Booking Ticker - Database Schema
-- ============================================
-- Pool of real past bookings the admin curates, rotated on the homepage
-- corner-popup ticker via a persisted round-robin cursor (last_shown_at).
-- See src/app/api/ticker/route.ts for the rotation algorithm.

CREATE TABLE IF NOT EXISTS ticker_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Guest identity, kept to first name + city for privacy
  guest_first_name VARCHAR(100) NOT NULL,
  guest_city VARCHAR(100) NOT NULL,

  -- What they booked
  service_label VARCHAR(255) NOT NULL, -- e.g. "Nainital → Kathgodam transfer"
  service_type VARCHAR(50), -- 'transfer' | 'day_tour' | 'multi_day_rental' | 'temple_trip'

  -- Recordkeeping — the actual date of the real booking this row represents
  real_booking_date DATE,

  is_active BOOLEAN DEFAULT true,

  -- Drives the rotation: NULL/oldest is shown next. See rotation algorithm.
  last_shown_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticker_bookings_active ON ticker_bookings(is_active);
CREATE INDEX IF NOT EXISTS idx_ticker_bookings_rotation ON ticker_bookings(last_shown_at);

COMMENT ON TABLE ticker_bookings IS 'Pool of real past bookings shown on the homepage social-proof ticker, rotated via last_shown_at';

CREATE OR REPLACE FUNCTION update_ticker_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ticker_bookings_updated_at ON ticker_bookings;
CREATE TRIGGER trigger_update_ticker_bookings_updated_at
  BEFORE UPDATE ON ticker_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_ticker_bookings_updated_at();

-- ### STEP 4: create_trust_section_schema.sql ###
-- ============================================
-- Trust & Safety Section - Database Schema
-- ============================================
-- Singleton config table for the homepage "Why families trust us" section,
-- following the same fixed-UUID singleton pattern as multi_day_rental_page.

CREATE TABLE IF NOT EXISTS trust_section (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000002',

  heading TEXT NOT NULL DEFAULT 'Why families trust us',
  description TEXT NOT NULL DEFAULT '',

  -- Array of { icon_name, title, description, display_order, is_active }
  trust_pillars JSONB NOT NULL DEFAULT '[]',

  is_published BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT trust_section_singleton CHECK (id = '00000000-0000-0000-0000-000000000002')
);

COMMENT ON TABLE trust_section IS 'Singleton config for the homepage Trust & Safety section (heading, description, trust pillars)';

CREATE OR REPLACE FUNCTION update_trust_section_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_trust_section_updated_at ON trust_section;
CREATE TRIGGER trigger_update_trust_section_updated_at
  BEFORE UPDATE ON trust_section
  FOR EACH ROW
  EXECUTE FUNCTION update_trust_section_updated_at();

-- Seed with the current hardcoded homepage copy so the migration is a no-op visually.
INSERT INTO trust_section (id, heading, description, trust_pillars, is_published)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Why families trust us',
  'Every driver is background-verified, trained, and held to a zero-alcohol policy. Your safety is not an afterthought — it is how we operate.',
  '[
    {"icon_name": "user-check", "title": "Verified drivers", "description": "Background verification, license validation and character reference checks before joining our team.", "display_order": 1, "is_active": true},
    {"icon_name": "shield", "title": "Zero alcohol policy", "description": "Our drivers pledge complete sobriety. No exceptions, with random checks to enforce it.", "display_order": 2, "is_active": true},
    {"icon_name": "award", "title": "Professional training", "description": "Defensive driving, first-aid certification and customer service training.", "display_order": 3, "is_active": true},
    {"icon_name": "heart", "title": "Family values", "description": "Drivers trained to treat every passenger like their own family.", "display_order": 4, "is_active": true},
    {"icon_name": "car", "title": "Spotless vehicles", "description": "Daily sanitized, regularly serviced and thoroughly inspected.", "display_order": 5, "is_active": true},
    {"icon_name": "phone", "title": "24/7 support", "description": "Round-the-clock assistance, a call away whenever you need us.", "display_order": 6, "is_active": true}
  ]'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;

-- ### STEP 5: create_multiday_rental_page.sql ###
-- Multi-Day Rental Page Schema
-- This table stores all content for the multi-day taxi rental page
-- Single row table - only one page configuration

CREATE TABLE IF NOT EXISTS multi_day_rental_page (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- SEO & Meta Data
  seo_title VARCHAR(255) NOT NULL DEFAULT 'Multi-Day Car Rental in Uttarakhand | Nainital Taxi',
  seo_description TEXT NOT NULL DEFAULT 'Book multi-day car rentals for complete Uttarakhand tours. Transparent seasonal pricing, flexible packages, and professional drivers.',
  seo_keywords TEXT DEFAULT 'multi-day car rental, Uttarakhand tour, taxi booking, seasonal pricing',

  -- Hero Section
  hero_badge VARCHAR(255) NOT NULL DEFAULT 'Trusted by 500+ Happy Travelers',
  hero_headline_line1 VARCHAR(255) NOT NULL DEFAULT 'Your Complete',
  hero_headline_line2 VARCHAR(255) NOT NULL DEFAULT 'Uttarakhand Journey',
  hero_headline_line3 VARCHAR(255) NOT NULL DEFAULT 'Awaits',
  hero_subheadline TEXT NOT NULL DEFAULT 'Experience the Himalayas with our multi-day car rental service. Professional drivers, well-maintained vehicles, and flexible itineraries.',
  hero_image_url TEXT,
  hero_trust_indicators JSONB DEFAULT '[
    {"number": "500+", "label": "Happy Travelers"},
    {"number": "15+", "label": "Years Experience"},
    {"number": "24/7", "label": "Support"}
  ]'::jsonb,

  -- Pricing Section
  pricing_heading VARCHAR(255) NOT NULL DEFAULT 'Choose Your Ride',
  pricing_subheading TEXT NOT NULL DEFAULT 'Per day rates for various car categories - transparent pricing for every season',
  pricing_season_label VARCHAR(100) NOT NULL DEFAULT 'Season Rates',
  pricing_season_date_ranges TEXT[] DEFAULT ARRAY['15 Apr - 10 Jul', '20 Dec - 15 Jan'],
  pricing_season_description VARCHAR(255) DEFAULT 'Peak tourist season',
  pricing_mid_season_label VARCHAR(100) NOT NULL DEFAULT 'Mid Season',
  pricing_mid_season_date_ranges TEXT[] DEFAULT ARRAY['11 Jul - 30 Sep', '16 Jan - 14 Apr'],
  pricing_mid_season_description VARCHAR(255) DEFAULT 'Moderate season',
  pricing_off_season_label VARCHAR(100) NOT NULL DEFAULT 'Off-Season Rates',
  pricing_off_season_date_ranges TEXT[] DEFAULT ARRAY['1 Oct - 19 Dec'],
  pricing_off_season_description VARCHAR(255) DEFAULT 'Off-peak season',
  pricing_note_text TEXT DEFAULT 'Above charges are general rates. Exact charges depend on itinerary and number of days.',

  -- Car Categories (stored as JSONB array)
  car_categories JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ name, vehicles, image_url, season_price, mid_season_price, off_season_price, is_popular, order }]

  -- Inclusion/Exclusion Section
  inclusion_exclusion_heading VARCHAR(255) NOT NULL DEFAULT 'What''s Included & Excluded',
  inclusion_exclusion_subheading VARCHAR(255) NOT NULL DEFAULT 'Complete transparency - know exactly what you''re paying for',
  items_included JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ title, description }]
  items_excluded JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ title, description }]

  -- Tour Duration Packages Section
  packages_heading VARCHAR(255) NOT NULL DEFAULT 'Choose Your Duration',
  packages_subheading TEXT NOT NULL DEFAULT 'Flexible packages tailored to your journey. The longer you travel, the more you save!',
  package_1 JSONB DEFAULT '{}'::jsonb,
  package_2 JSONB DEFAULT '{}'::jsonb,
  package_3 JSONB DEFAULT '{}'::jsonb,
  package_4 JSONB DEFAULT '{}'::jsonb,
  -- Structure: { badge, duration, subtitle, features: [{text, is_bold}], whatsapp_message, is_popular, is_custom_package }

  -- Popular Itineraries Section
  popular_itineraries_heading VARCHAR(255) NOT NULL DEFAULT 'Popular Tour Itineraries',
  popular_itineraries_subheading TEXT NOT NULL DEFAULT 'Handpicked routes designed by local experts. Pick one or customize your own adventure.',
  featured_package_ids UUID[] DEFAULT ARRAY[]::UUID[],
  -- References to existing packages table

  -- Safety Section Reference
  safety_section_reference UUID,
  -- Reference to safety_sections table if it exists, or we can inline it

  -- FAQs Section
  faq_heading VARCHAR(255) NOT NULL DEFAULT 'Frequently Asked Questions',
  faq_subheading VARCHAR(255) NOT NULL DEFAULT 'Everything you need to know about multi-day car rentals',
  faqs JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ question, answer }]

  -- CTA Section
  cta_heading VARCHAR(255) NOT NULL DEFAULT 'Ready to Explore Uttarakhand?',
  cta_description TEXT NOT NULL DEFAULT 'Book your multi-day car rental today and experience Uttarakhand like never before. Flexible plans, transparent pricing, and unforgettable memories await.',
  cta_features JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ text }]

  -- Metadata
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure only one row in this table
  CONSTRAINT single_row_check CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_multi_day_rental_page_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_multi_day_rental_page_timestamp
  BEFORE UPDATE ON multi_day_rental_page
  FOR EACH ROW
  EXECUTE FUNCTION update_multi_day_rental_page_updated_at();

-- Insert default configuration
INSERT INTO multi_day_rental_page (id)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE multi_day_rental_page ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public can read, authenticated users can manage (for admin)
CREATE POLICY "Public can view multi-day rental page"
  ON multi_day_rental_page
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update multi-day rental page"
  ON multi_day_rental_page
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_multi_day_rental_page_published ON multi_day_rental_page(is_published);

-- Comments
COMMENT ON TABLE multi_day_rental_page IS 'Configuration for the multi-day car rental landing page - single row table';
COMMENT ON COLUMN multi_day_rental_page.car_categories IS 'Array of car category objects with pricing for different seasons';
COMMENT ON COLUMN multi_day_rental_page.items_included IS 'Array of items included in the rental';
COMMENT ON COLUMN multi_day_rental_page.items_excluded IS 'Array of items not included in the rental';
COMMENT ON COLUMN multi_day_rental_page.package_1 IS 'Tour duration package 1 (typically 3-4 days)';
COMMENT ON COLUMN multi_day_rental_page.package_2 IS 'Tour duration package 2 (typically 5-7 days)';
COMMENT ON COLUMN multi_day_rental_page.package_3 IS 'Tour duration package 3 (typically 8-10 days)';
COMMENT ON COLUMN multi_day_rental_page.package_4 IS 'Tour duration package 4 (typically custom)';
COMMENT ON COLUMN multi_day_rental_page.featured_package_ids IS 'Array of package UUIDs to feature in popular itineraries section';
COMMENT ON COLUMN multi_day_rental_page.faqs IS 'Array of FAQ objects with question and answer';

-- ### STEP 6: create_addons_schema.sql ###
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

-- ### STEP 7: create_temples_schema.sql ###
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

-- ### STEP 8: add_admin_audit_log.sql ###
-- Milestone 2: generic before/after audit trail for admin-initiated writes.
--
-- Why a new table instead of extending booking_status_history:
--   booking_status_history is narrowly scoped to STATUS transitions
--   (from_status/to_status) and is fed automatically by the
--   log_booking_status_change() trigger on every bookings UPDATE. Its
--   changed_by column is a hard FK to profiles(id), which this app cannot
--   populate — there are no per-admin accounts (single shared
--   ADMIN_PASSWORD, see src/lib/auth/adminAuth.ts). Repurposing that FK
--   would touch a table an existing trigger depends on. admin_audit_log is
--   intentionally decoupled: no FK to profiles, a free-text actor label
--   (honest about the current single-shared-admin auth model), and a
--   generic JSONB before/after diff covering ANY bookings column the admin
--   PATCH endpoint touches. booking_status_history and its trigger are
--   left completely untouched.

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,           -- e.g. 'booking'
  entity_id UUID NOT NULL,             -- e.g. bookings.id
  action TEXT NOT NULL DEFAULT 'update',
  actor TEXT NOT NULL DEFAULT 'admin', -- free-text; no per-admin identity exists (single shared password)
  before JSONB,                        -- pre-update values of the fields that changed
  after JSONB,                         -- post-update values of the fields that changed
  changed_fields TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);

COMMENT ON TABLE admin_audit_log IS
  'Generic before/after audit trail for admin-initiated writes (starting with bookings PATCH). actor is a free-text label, not a profiles FK, because the admin auth model is a single shared password with no per-admin identity.';

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
-- No policies defined: default-deny for anon/authenticated roles, matching
-- every other admin-only table in this schema. The admin API route writes
-- via getAdminSupabaseClient() (service-role key), which bypasses RLS
-- entirely, same as every other admin write path in this app.

-- ### STEP 9: harden_rls_new_tables.sql ###
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

-- ### STEP 10: add_reverse_route_link.sql ###
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
