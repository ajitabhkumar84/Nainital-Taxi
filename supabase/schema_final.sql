-- ============================================================================
-- NAINITAL TAXI - DATABASE SCHEMA (FINAL - SIMPLIFIED)
-- ============================================================================
-- Simplified pricing: Only 2 seasons (Off-Season, Season)
-- Dates controlled by admin via database
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE booking_status AS ENUM (
  'pending', 'payment_pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded'
);

CREATE TYPE package_type AS ENUM ('tour', 'transfer', 'custom');

-- NEW: 4 Vehicle Categories
CREATE TYPE vehicle_type AS ENUM (
  'sedan',              -- Dzire, Amaze, Xcent
  'suv_normal',         -- Ertiga, Triber, Xylo, Tavera
  'suv_deluxe',         -- Innova, Marazzo
  'suv_luxury'          -- Innova Crysta
);

CREATE TYPE vehicle_status AS ENUM ('available', 'booked', 'maintenance', 'retired');
CREATE TYPE availability_status AS ENUM ('available', 'limited', 'sold_out', 'blocked');
CREATE TYPE waitlist_status AS ENUM ('pending', 'notified', 'converted', 'expired', 'cancelled');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  whatsapp_number TEXT,
  total_bookings INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  loyalty_tier TEXT DEFAULT 'standard' CHECK (loyalty_tier IN ('standard', 'silver', 'gold', 'platinum')),
  is_vip BOOLEAN DEFAULT FALSE,
  preferred_vehicle_type vehicle_type,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_phone ON profiles(phone);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  nickname TEXT,
  registration_number TEXT UNIQUE,
  vehicle_type vehicle_type NOT NULL,
  status vehicle_status DEFAULT 'available',
  model_name TEXT,                          -- e.g., "Dzire", "Innova Crysta"
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

CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_active ON vehicles(is_active) WHERE is_active = TRUE;

-- Destinations
CREATE TABLE destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  highlights TEXT[],
  best_time_to_visit TEXT,
  duration TEXT,
  distance_from_nainital INTEGER,
  hero_image_url TEXT,
  gallery_urls TEXT[],
  emoji TEXT,
  meta_title TEXT,
  meta_description TEXT,
  display_order INTEGER DEFAULT 0,
  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_destinations_slug ON destinations(slug);

-- Packages (No pricing data here)
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  type package_type NOT NULL,
  duration TEXT,
  distance INTEGER,
  places_covered TEXT[],
  description TEXT,
  includes TEXT[],
  excludes TEXT[],
  itinerary JSONB,
  destination_ids UUID[],
  image_url TEXT,
  gallery_urls TEXT[],
  is_popular BOOLEAN DEFAULT FALSE,
  is_seasonal BOOLEAN DEFAULT FALSE,
  availability_status availability_status DEFAULT 'available',
  min_passengers INTEGER DEFAULT 1,
  max_passengers INTEGER,
  suitable_for TEXT[],
  meta_title TEXT,
  meta_description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_packages_slug ON packages(slug);
CREATE INDEX idx_packages_active ON packages(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- SEASONS TABLE (SIMPLIFIED - Only 2 seasons)
-- ============================================================================
CREATE TABLE seasons (
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

CREATE INDEX idx_seasons_dates ON seasons(start_date, end_date);

COMMENT ON TABLE seasons IS 'Only 2 seasons: Off-Season and Season. Admin controls dates.';

-- ============================================================================
-- PRICING TABLE (SIMPLIFIED - 2 prices per package-vehicle combo)
-- ============================================================================
CREATE TABLE pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,

  price INTEGER NOT NULL CHECK (price >= 0),
  notes TEXT,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each package-vehicle can have max 2 prices (off-season + season)
  UNIQUE(package_id, vehicle_type, season_id)
);

CREATE INDEX idx_pricing_package ON pricing(package_id);
CREATE INDEX idx_pricing_vehicle ON pricing(vehicle_type);
CREATE INDEX idx_pricing_season ON pricing(season_id);

COMMENT ON TABLE pricing IS 'Manual pricing: 2 prices per package-vehicle (off-season, season)';

-- ============================================================================
-- OTHER TABLES (Availability, Bookings, Waitlist, Reviews)
-- ============================================================================

CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  total_fleet_size INTEGER DEFAULT 10,
  cars_booked INTEGER DEFAULT 0,
  cars_available INTEGER GENERATED ALWAYS AS (total_fleet_size - cars_booked) STORED,
  status availability_status DEFAULT 'available',
  internal_notes TEXT,
  public_message TEXT,
  synced_from_gcal BOOLEAN DEFAULT FALSE,
  gcal_event_id TEXT,
  last_synced_at TIMESTAMPTZ,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_booking_count CHECK (cars_booked >= 0 AND cars_booked <= total_fleet_size)
);

CREATE INDEX idx_availability_date ON availability(date);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES profiles(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_whatsapp TEXT,

  package_id UUID REFERENCES packages(id),
  package_name TEXT NOT NULL,
  vehicle_type vehicle_type NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id),

  booking_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT,
  passengers INTEGER NOT NULL,

  special_requests TEXT,
  requires_child_seat BOOLEAN DEFAULT FALSE,
  extra_stops TEXT[],

  -- Simplified pricing
  final_price INTEGER NOT NULL,
  season_id UUID REFERENCES seasons(id),
  currency TEXT DEFAULT 'INR',

  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'received', 'verified', 'refunded')),
  payment_method TEXT,
  payment_screenshot_url TEXT,
  upi_transaction_id TEXT,
  payment_received_at TIMESTAMPTZ,
  payment_verified_at TIMESTAMPTZ,

  status booking_status DEFAULT 'pending',

  whatsapp_message_sent BOOLEAN DEFAULT FALSE,
  confirmation_sent BOOLEAN DEFAULT FALSE,
  reminder_sent BOOLEAN DEFAULT FALSE,

  assigned_driver_name TEXT,
  assigned_driver_phone TEXT,
  driver_assigned_at TIMESTAMPTZ,

  trip_started_at TIMESTAMPTZ,
  trip_completed_at TIMESTAMPTZ,
  actual_distance INTEGER,

  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by TEXT,
  refund_amount INTEGER,
  refunded_at TIMESTAMPTZ,

  booking_source TEXT DEFAULT 'website',
  admin_notes TEXT,
  internal_tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);

CREATE TABLE booking_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  from_status booking_status,
  to_status booking_status NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  changed_by_name TEXT,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_history_booking ON booking_status_history(booking_id);

CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_whatsapp TEXT,
  desired_date DATE NOT NULL,
  package_id UUID REFERENCES packages(id),
  package_name TEXT NOT NULL,
  vehicle_type vehicle_type NOT NULL,
  passengers INTEGER NOT NULL,
  estimated_price INTEGER NOT NULL,
  priority INTEGER DEFAULT 100,
  is_vip BOOLEAN DEFAULT FALSE,
  status waitlist_status DEFAULT 'pending',
  notified_at TIMESTAMPTZ,
  notification_method TEXT,
  expires_at TIMESTAMPTZ,
  converted_to_booking_id UUID REFERENCES bookings(id),
  converted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_waitlist_date ON waitlist(desired_date);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  booking_id UUID REFERENCES bookings(id),
  customer_name TEXT NOT NULL,
  customer_location TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT NOT NULL,
  photos TEXT[],
  admin_response TEXT,
  admin_response_at TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_approved ON reviews(is_approved) WHERE is_approved = TRUE;

CREATE TABLE admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO admin_settings (key, value, description) VALUES
  ('fleet_size', '10', 'Total vehicles in fleet'),
  ('upi_id', '"yourname@paytm"', 'UPI ID for payments'),
  ('whatsapp_number', '"+918445206116"', 'WhatsApp Business number'),
  ('business_phone', '"+918445206116"', 'Primary business phone'),
  ('business_email', '"info@nainitaltaxi.in"', 'Business email');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_availability_updated_at BEFORE UPDATE ON availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_availability_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_blocked THEN
    NEW.status = 'blocked';
  ELSIF NEW.cars_available >= 3 THEN
    NEW.status = 'available';
  ELSIF NEW.cars_available > 0 THEN
    NEW.status = 'limited';
  ELSE
    NEW.status = 'sold_out';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_availability_status BEFORE INSERT OR UPDATE ON availability
  FOR EACH ROW EXECUTE FUNCTION update_availability_status();

CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO booking_status_history (booking_id, from_status, to_status, changed_by_name, notes)
    VALUES (NEW.id, OLD.status, NEW.status, 'System', 'Status changed');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_booking_status_changes AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION log_booking_status_change();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON vehicles FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read" ON destinations FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read" ON packages FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read" ON pricing FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read" ON seasons FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read" ON availability FOR SELECT USING (TRUE);
CREATE POLICY "Public read" ON reviews FOR SELECT USING (is_approved = TRUE);

CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE VIEW upcoming_bookings AS
SELECT
  b.id, b.customer_name, b.customer_phone, b.booking_date, b.pickup_time,
  b.pickup_location, b.package_name, b.vehicle_type, v.name as vehicle_name,
  b.passengers, b.final_price, b.status, b.payment_status
FROM bookings b
LEFT JOIN vehicles v ON b.vehicle_id = v.id
WHERE b.booking_date >= CURRENT_DATE AND b.status NOT IN ('cancelled', 'completed')
ORDER BY b.booking_date, b.pickup_time;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
