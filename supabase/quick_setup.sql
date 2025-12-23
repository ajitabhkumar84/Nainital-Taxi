-- ============================================================================
-- QUICK SETUP FOR FLEET PAGE
-- Run this in Supabase SQL Editor to get the Fleet page working
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE vehicle_type AS ENUM (
    'sedan',              -- Dzire, Amaze, Xcent
    'suv_normal',         -- Ertiga, Triber, Xylo, Tavera
    'suv_deluxe',         -- Innova, Marazzo
    'suv_luxury'          -- Innova Crysta
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_status AS ENUM ('available', 'booked', 'maintenance', 'retired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE package_type AS ENUM ('tour', 'transfer', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- VEHICLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  nickname TEXT,
  registration_number TEXT UNIQUE,
  vehicle_type vehicle_type NOT NULL,
  status vehicle_status DEFAULT 'available',
  model_name TEXT,
  capacity INTEGER NOT NULL,
  luggage_capacity INTEGER,
  has_ac BOOLEAN DEFAULT TRUE,
  has_music_system BOOLEAN DEFAULT TRUE,
  has_child_seat BOOLEAN DEFAULT FALSE,

  -- Retro Pop Attributes
  primary_color TEXT,
  color_hex TEXT,
  emoji TEXT,
  personality_trait TEXT,
  tagline TEXT,

  image_urls TEXT[],
  featured_image_url TEXT,

  last_service_date DATE,
  next_service_date DATE,
  total_trips INTEGER DEFAULT 0,
  total_kilometers INTEGER DEFAULT 0,

  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_active ON vehicles(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- SEASONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,              -- 'Off-Season' or 'Season'
  description TEXT,

  -- Date ranges (YOU control these)
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- For recurring seasons
  is_recurring BOOLEAN DEFAULT TRUE,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT only_two_seasons CHECK (name IN ('Off-Season', 'Season'))
);

CREATE INDEX IF NOT EXISTS idx_seasons_dates ON seasons(start_date, end_date);

-- ============================================================================
-- PACKAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  type package_type NOT NULL,
  duration TEXT,
  distance INTEGER,  -- Distance in kilometers

  places_covered TEXT[],
  description TEXT,
  includes TEXT[],
  excludes TEXT[],

  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packages_type ON packages(type);
CREATE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug);

-- ============================================================================
-- PRICING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,

  price INTEGER NOT NULL,  -- Price in INR, no decimals
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(package_id, vehicle_type, season_id)
);

CREATE INDEX IF NOT EXISTS idx_pricing_package ON pricing(package_id);
CREATE INDEX IF NOT EXISTS idx_pricing_season ON pricing(season_id);

-- ============================================================================
-- DISABLE ROW LEVEL SECURITY (for testing)
-- ============================================================================

ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE seasons DISABLE ROW LEVEL SECURITY;
ALTER TABLE packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE pricing DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SAMPLE DATA - SEASONS
-- ============================================================================

INSERT INTO seasons (name, description, start_date, end_date, is_recurring, is_active)
VALUES
  ('Off-Season', 'Regular pricing for off-peak months', '2025-01-01', '2025-03-31', true, true),
  ('Season', 'Peak season pricing', '2025-04-01', '2025-06-30', true, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - PACKAGES
-- ============================================================================

INSERT INTO packages (slug, title, type, duration, distance, places_covered, description, is_popular, display_order)
VALUES
  ('nainital-darshan', 'Nainital Darshan', 'tour', '8-10 hours', 40,
   ARRAY['Naini Lake', 'Naina Devi Temple', 'Mall Road', 'Tiffin Top', 'Snow View Point'],
   'Complete sightseeing tour of Nainital covering all major attractions',
   true, 1),

  ('kathgodam-nainital', 'Kathgodam to Nainital Transfer', 'transfer', '1.5 hours', 35,
   ARRAY['Kathgodam Railway Station', 'Nainital'],
   'Comfortable transfer from Kathgodam Railway Station to Nainital hotels',
   true, 2)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - VEHICLES
-- ============================================================================

INSERT INTO vehicles (name, vehicle_type, model_name, capacity, luggage_capacity, has_ac, has_music_system, has_child_seat, emoji, tagline, is_featured, display_order, status)
VALUES
  ('Sunshine Rider', 'sedan', 'Maruti Dzire', 4, 2, true, true, false, '☀️', 'Your cheerful companion for city tours', true, 1, 'available'),
  ('Mountain Explorer', 'suv_normal', 'Maruti Ertiga', 7, 3, true, true, true, '⛰️', 'Built for hill station adventures', true, 2, 'available'),
  ('Comfort Cruiser', 'suv_deluxe', 'Toyota Innova', 7, 4, true, true, true, '✨', 'Premium comfort for your journey', true, 3, 'available'),
  ('Luxury Glide', 'suv_luxury', 'Innova Crysta', 7, 4, true, true, true, '👑', 'Travel in ultimate luxury', true, 4, 'available')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - PRICING
-- ============================================================================

-- Get season IDs
DO $$
DECLARE
  off_season_id UUID;
  peak_season_id UUID;
  nainital_darshan_id UUID;
  kathgodam_transfer_id UUID;
BEGIN
  SELECT id INTO off_season_id FROM seasons WHERE name = 'Off-Season' LIMIT 1;
  SELECT id INTO peak_season_id FROM seasons WHERE name = 'Season' LIMIT 1;
  SELECT id INTO nainital_darshan_id FROM packages WHERE slug = 'nainital-darshan' LIMIT 1;
  SELECT id INTO kathgodam_transfer_id FROM packages WHERE slug = 'kathgodam-nainital' LIMIT 1;

  -- Nainital Darshan - Off-Season
  INSERT INTO pricing (package_id, vehicle_type, season_id, price)
  VALUES
    (nainital_darshan_id, 'sedan', off_season_id, 2000),
    (nainital_darshan_id, 'suv_normal', off_season_id, 2500),
    (nainital_darshan_id, 'suv_deluxe', off_season_id, 3000),
    (nainital_darshan_id, 'suv_luxury', off_season_id, 3500)
  ON CONFLICT (package_id, vehicle_type, season_id) DO NOTHING;

  -- Nainital Darshan - Peak Season
  INSERT INTO pricing (package_id, vehicle_type, season_id, price)
  VALUES
    (nainital_darshan_id, 'sedan', peak_season_id, 2500),
    (nainital_darshan_id, 'suv_normal', peak_season_id, 3000),
    (nainital_darshan_id, 'suv_deluxe', peak_season_id, 3500),
    (nainital_darshan_id, 'suv_luxury', peak_season_id, 4000)
  ON CONFLICT (package_id, vehicle_type, season_id) DO NOTHING;

  -- Kathgodam Transfer - Off-Season
  INSERT INTO pricing (package_id, vehicle_type, season_id, price)
  VALUES
    (kathgodam_transfer_id, 'sedan', off_season_id, 800),
    (kathgodam_transfer_id, 'suv_normal', off_season_id, 1000),
    (kathgodam_transfer_id, 'suv_deluxe', off_season_id, 1200),
    (kathgodam_transfer_id, 'suv_luxury', off_season_id, 1500)
  ON CONFLICT (package_id, vehicle_type, season_id) DO NOTHING;

  -- Kathgodam Transfer - Peak Season
  INSERT INTO pricing (package_id, vehicle_type, season_id, price)
  VALUES
    (kathgodam_transfer_id, 'sedan', peak_season_id, 1000),
    (kathgodam_transfer_id, 'suv_normal', peak_season_id, 1200),
    (kathgodam_transfer_id, 'suv_deluxe', peak_season_id, 1500),
    (kathgodam_transfer_id, 'suv_luxury', peak_season_id, 1800)
  ON CONFLICT (package_id, vehicle_type, season_id) DO NOTHING;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Setup complete!' as status;
SELECT COUNT(*) as vehicle_count FROM vehicles;
SELECT COUNT(*) as season_count FROM seasons;
SELECT COUNT(*) as package_count FROM packages;
SELECT COUNT(*) as pricing_count FROM pricing;
