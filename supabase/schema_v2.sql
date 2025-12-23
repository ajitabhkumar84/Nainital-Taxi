-- ============================================================================
-- NAINITAL TAXI - DATABASE SCHEMA V2
-- ============================================================================
-- Updated schema with new vehicle categories and manual pricing
-- Changes from V1:
-- 1. New vehicle types: sedan, suv_normal, suv_deluxe, suv_luxury
-- 2. Manual pricing instead of formula-based (pricing table)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS - Type Definitions
-- ============================================================================

-- Booking status lifecycle
CREATE TYPE booking_status AS ENUM (
  'pending',
  'payment_pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'refunded'
);

-- Package types
CREATE TYPE package_type AS ENUM (
  'tour',
  'transfer',
  'custom'
);

-- NEW: Updated Vehicle types
CREATE TYPE vehicle_type AS ENUM (
  'sedan',              -- Dzire, Amaze, Xcent
  'suv_normal',         -- Ertiga, Triber, Xylo, Tavera
  'suv_deluxe',         -- Innova, Mazaroo
  'suv_luxury'          -- Innova Crysta
);

-- Vehicle status
CREATE TYPE vehicle_status AS ENUM (
  'available',
  'booked',
  'maintenance',
  'retired'
);

-- Availability status
CREATE TYPE availability_status AS ENUM (
  'available',
  'limited',
  'sold_out',
  'blocked'
);

-- Waitlist status
CREATE TYPE waitlist_status AS ENUM (
  'pending',
  'notified',
  'converted',
  'expired',
  'cancelled'
);

-- ============================================================================
-- TABLE: users (extends Supabase Auth)
-- ============================================================================
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
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_loyalty_tier ON profiles(loyalty_tier);

-- ============================================================================
-- TABLE: vehicles (Fleet Management)
-- ============================================================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity
  name TEXT NOT NULL UNIQUE,
  nickname TEXT,
  registration_number TEXT UNIQUE,
  vehicle_type vehicle_type NOT NULL,
  status vehicle_status DEFAULT 'available',

  -- Specifications
  model_name TEXT,                          -- NEW: e.g., "Dzire", "Innova Crysta"
  capacity INTEGER NOT NULL,
  luggage_capacity INTEGER,
  has_ac BOOLEAN DEFAULT TRUE,
  has_music_system BOOLEAN DEFAULT TRUE,
  has_child_seat BOOLEAN DEFAULT FALSE,

  -- Retro Pop Aesthetic Attributes
  primary_color TEXT,
  color_hex TEXT,
  emoji TEXT,
  personality_trait TEXT,
  tagline TEXT,

  -- Media
  image_urls TEXT[],
  featured_image_url TEXT,

  -- Maintenance
  last_service_date DATE,
  next_service_date DATE,
  total_trips INTEGER DEFAULT 0,
  total_kilometers INTEGER DEFAULT 0,

  -- Metadata
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_active ON vehicles(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- TABLE: destinations
-- ============================================================================
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
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
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
CREATE INDEX idx_destinations_popular ON destinations(is_popular) WHERE is_popular = TRUE;

-- ============================================================================
-- TABLE: packages (UPDATED - No multipliers, just metadata)
-- ============================================================================
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  type package_type NOT NULL,

  -- Details
  duration TEXT,
  distance INTEGER,
  places_covered TEXT[],
  description TEXT,
  includes TEXT[],
  excludes TEXT[],
  itinerary JSONB,

  -- Destinations (for tours)
  destination_ids UUID[],

  -- Media
  image_url TEXT,
  gallery_urls TEXT[],

  -- Badges & Status
  is_popular BOOLEAN DEFAULT FALSE,
  is_seasonal BOOLEAN DEFAULT FALSE,
  availability_status availability_status DEFAULT 'available',

  -- Restrictions
  min_passengers INTEGER DEFAULT 1,
  max_passengers INTEGER,
  suitable_for TEXT[],

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Metadata
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_packages_slug ON packages(slug);
CREATE INDEX idx_packages_type ON packages(type);
CREATE INDEX idx_packages_popular ON packages(is_popular) WHERE is_popular = TRUE;
CREATE INDEX idx_packages_active ON packages(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- TABLE: seasons (Peak/Off-Peak Periods)
-- ============================================================================
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

CREATE INDEX idx_seasons_dates ON seasons(start_date, end_date);
CREATE INDEX idx_seasons_active ON seasons(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- NEW TABLE: pricing (Manual Price Entry)
-- ============================================================================
-- This table stores actual prices for each package-vehicle-season combination
-- Submitted manually by admin, not calculated
CREATE TABLE pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- What package for what vehicle type
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,

  -- Optional: For seasonal pricing
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,

  -- The actual price (in INR)
  price INTEGER NOT NULL CHECK (price >= 0),

  -- Optional notes
  notes TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique combination
  UNIQUE(package_id, vehicle_type, season_id)
);

CREATE INDEX idx_pricing_package ON pricing(package_id);
CREATE INDEX idx_pricing_vehicle_type ON pricing(vehicle_type);
CREATE INDEX idx_pricing_season ON pricing(season_id);
CREATE INDEX idx_pricing_active ON pricing(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE pricing IS 'Manual price entries for package-vehicle-season combinations';
COMMENT ON COLUMN pricing.season_id IS 'NULL means base/regular season pricing';

-- ============================================================================
-- TABLE: availability (Daily Fleet Availability)
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
CREATE INDEX idx_availability_status ON availability(status);
CREATE INDEX idx_availability_upcoming ON availability(date) WHERE date >= CURRENT_DATE;

-- ============================================================================
-- TABLE: bookings (Core Booking Lifecycle)
-- ============================================================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Customer
  user_id UUID REFERENCES profiles(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_whatsapp TEXT,

  -- Package & Vehicle
  package_id UUID REFERENCES packages(id),
  package_name TEXT NOT NULL,
  vehicle_type vehicle_type NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id),

  -- Trip Details
  booking_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT,
  passengers INTEGER NOT NULL,

  -- Special Requests
  special_requests TEXT,
  requires_child_seat BOOLEAN DEFAULT FALSE,
  extra_stops TEXT[],

  -- Pricing (UPDATED - No multipliers, just final price)
  final_price INTEGER NOT NULL,
  season_id UUID REFERENCES seasons(id),
  currency TEXT DEFAULT 'INR',

  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'received', 'verified', 'refunded')),
  payment_method TEXT,
  payment_screenshot_url TEXT,
  upi_transaction_id TEXT,
  payment_received_at TIMESTAMPTZ,
  payment_verified_at TIMESTAMPTZ,

  -- Status Management
  status booking_status DEFAULT 'pending',

  -- Communication
  whatsapp_message_sent BOOLEAN DEFAULT FALSE,
  confirmation_sent BOOLEAN DEFAULT FALSE,
  reminder_sent BOOLEAN DEFAULT FALSE,

  -- Driver Assignment
  assigned_driver_name TEXT,
  assigned_driver_phone TEXT,
  driver_assigned_at TIMESTAMPTZ,

  -- Trip Tracking
  trip_started_at TIMESTAMPTZ,
  trip_completed_at TIMESTAMPTZ,
  actual_distance INTEGER,

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by TEXT,
  refund_amount INTEGER,
  refunded_at TIMESTAMPTZ,

  -- Metadata
  booking_source TEXT DEFAULT 'website',
  admin_notes TEXT,
  internal_tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_package ON bookings(package_id);
CREATE INDEX idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_bookings_upcoming ON bookings(booking_date) WHERE booking_date >= CURRENT_DATE;

-- ============================================================================
-- TABLE: booking_status_history (Audit Trail)
-- ============================================================================
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
CREATE INDEX idx_booking_history_created ON booking_status_history(created_at DESC);

-- ============================================================================
-- TABLE: waitlist (Velvet Rope Logic)
-- ============================================================================
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
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_priority ON waitlist(desired_date, priority) WHERE status = 'pending';
CREATE INDEX idx_waitlist_active ON waitlist(status) WHERE status IN ('pending', 'notified');

-- ============================================================================
-- TABLE: reviews (Customer Testimonials)
-- ============================================================================
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

CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_featured ON reviews(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_reviews_approved ON reviews(is_approved) WHERE is_approved = TRUE;

-- ============================================================================
-- TABLE: admin_settings (Configuration)
-- ============================================================================
CREATE TABLE admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO admin_settings (key, value, description) VALUES
  ('fleet_size', '10', 'Total number of vehicles in fleet'),
  ('upi_id', '"yourname@paytm"', 'Primary UPI ID for payments'),
  ('upi_qr_url', '""', 'URL to UPI QR code image'),
  ('whatsapp_number', '"+918445206116"', 'WhatsApp Business number'),
  ('business_phone', '"+918445206116"', 'Primary business phone'),
  ('business_email', '"info@nainitaltaxi.in"', 'Business email'),
  ('waitlist_enabled', 'true', 'Enable waitlist feature'),
  ('waitlist_expiry_hours', '24', 'Hours before waitlist spot expires'),
  ('booking_advance_days', '90', 'Maximum days in advance for booking'),
  ('cancellation_hours', '24', 'Hours before trip for free cancellation'),
  ('google_calendar_sync_enabled', 'false', 'Enable Google Calendar sync');

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
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
CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update availability status
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

-- Log booking status changes
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO booking_status_history (
      booking_id, from_status, to_status, changed_by_name, notes
    ) VALUES (
      NEW.id, OLD.status, NEW.status, 'System',
      'Status changed from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_booking_status_changes AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION log_booking_status_change();

-- Update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE profiles
    SET total_bookings = total_bookings + 1, total_spent = total_spent + NEW.final_price
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
    UPDATE profiles
    SET total_bookings = total_bookings + 1, total_spent = total_spent + NEW.final_price
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_stats AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access" ON vehicles FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read access" ON destinations FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read access" ON packages FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read access" ON pricing FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read access" ON seasons FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read access" ON availability FOR SELECT USING (TRUE);
CREATE POLICY "Public read approved reviews" ON reviews FOR SELECT USING (is_approved = TRUE);

-- User-scoped access
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own waitlist" ON waitlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create waitlist entries" ON waitlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own reviews" ON reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE VIEW active_vehicles_summary AS
SELECT
  vehicle_type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'available') as available_count,
  COUNT(*) FILTER (WHERE status = 'booked') as booked_count,
  COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance_count
FROM vehicles
WHERE is_active = TRUE
GROUP BY vehicle_type;

CREATE VIEW upcoming_bookings AS
SELECT
  b.id, b.customer_name, b.customer_phone, b.booking_date, b.pickup_time,
  b.pickup_location, b.package_name, b.vehicle_type, v.name as vehicle_name,
  b.passengers, b.final_price, b.status, b.payment_status
FROM bookings b
LEFT JOIN vehicles v ON b.vehicle_id = v.id
WHERE b.booking_date >= CURRENT_DATE AND b.status NOT IN ('cancelled', 'completed')
ORDER BY b.booking_date, b.pickup_time;

CREATE VIEW availability_calendar AS
SELECT
  a.date, a.total_fleet_size, a.cars_booked, a.cars_available, a.status, a.is_blocked,
  COUNT(b.id) as confirmed_bookings_count
FROM availability a
LEFT JOIN bookings b ON b.booking_date = a.date AND b.status = 'confirmed'
WHERE a.date >= CURRENT_DATE AND a.date <= CURRENT_DATE + INTERVAL '90 days'
GROUP BY a.id, a.date, a.total_fleet_size, a.cars_booked, a.cars_available, a.status, a.is_blocked
ORDER BY a.date;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE vehicles IS 'Fleet management with vehicle model details';
COMMENT ON TABLE pricing IS 'Manual price entries - no formulas, admin submits all prices';
COMMENT ON TABLE bookings IS 'Core booking lifecycle with final price only';
COMMENT ON TABLE availability IS 'Daily fleet availability for booking system';
COMMENT ON TABLE waitlist IS 'Velvet Rope logic - customers waiting for sold-out dates';

-- ============================================================================
-- END OF SCHEMA V2
-- ============================================================================
