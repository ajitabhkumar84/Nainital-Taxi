-- ============================================================================
-- NAINITAL FUN TAXI - DATABASE SCHEMA
-- ============================================================================
-- Production-ready PostgreSQL schema for Supabase
-- Supports: Fleet Management, Booking Lifecycle, Velvet Rope Logic, User Profiles
-- Version: 1.0
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS - Type Definitions
-- ============================================================================

-- Booking status lifecycle
CREATE TYPE booking_status AS ENUM (
  'pending',           -- Initial state: Awaiting payment confirmation
  'payment_pending',   -- Payment screenshot received, verification pending
  'confirmed',         -- Payment verified, booking confirmed
  'in_progress',       -- Journey started
  'completed',         -- Journey completed
  'cancelled',         -- Cancelled by customer or admin
  'refunded'          -- Payment refunded
);

-- Package types
CREATE TYPE package_type AS ENUM (
  'tour',              -- Sightseeing packages
  'transfer',          -- Point-to-point transfers
  'custom'            -- Custom itineraries
);

-- Vehicle types
CREATE TYPE vehicle_type AS ENUM (
  'sedan',
  'suv',
  'tempo_traveller',
  'luxury'
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
  'available',         -- 3+ cars available
  'limited',          -- 1-2 cars available (show urgency)
  'sold_out',         -- 0 cars available (show waitlist)
  'blocked'           -- Admin blocked date (holidays, etc.)
);

-- Waitlist status
CREATE TYPE waitlist_status AS ENUM (
  'pending',          -- Waiting for spot
  'notified',         -- Customer notified of availability
  'converted',        -- Converted to booking
  'expired',          -- Waitlist expired
  'cancelled'         -- Customer cancelled waitlist
);

-- ============================================================================
-- TABLE: users (extends Supabase Auth)
-- ============================================================================
-- User profiles linked to Supabase Auth
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

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_loyalty_tier ON profiles(loyalty_tier);

-- ============================================================================
-- TABLE: vehicles (Fleet Management with Retro Pop Aesthetic)
-- ============================================================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity
  name TEXT NOT NULL UNIQUE,              -- e.g., "Sunshine Express 🌞", "Teal Thunder ⚡"
  nickname TEXT,                          -- Quirky nickname for marketing
  registration_number TEXT UNIQUE,
  vehicle_type vehicle_type NOT NULL,
  status vehicle_status DEFAULT 'available',

  -- Specifications
  capacity INTEGER NOT NULL,              -- Number of passengers
  luggage_capacity INTEGER,               -- Number of large bags
  has_ac BOOLEAN DEFAULT TRUE,
  has_music_system BOOLEAN DEFAULT TRUE,
  has_child_seat BOOLEAN DEFAULT FALSE,

  -- Retro Pop Aesthetic Attributes
  primary_color TEXT,                     -- e.g., "Sunshine Yellow", "Coral Pink"
  color_hex TEXT,                         -- Hex code for UI display
  emoji TEXT,                             -- Vehicle emoji (🚕, 🚙, 🚐)
  personality_trait TEXT,                 -- e.g., "Adventurous", "Cozy", "Luxurious"
  tagline TEXT,                           -- e.g., "Your vacation wingman!"

  -- Media
  image_urls TEXT[],                      -- Array of vehicle photo URLs
  featured_image_url TEXT,                -- Primary photo

  -- Pricing
  base_price_multiplier DECIMAL(3,2) DEFAULT 1.00,  -- Per-vehicle multiplier

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

-- Indexes
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_active ON vehicles(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- TABLE: destinations
-- ============================================================================
CREATE TABLE destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity
  slug TEXT NOT NULL UNIQUE,              -- URL-friendly (e.g., "bhimtal")
  name TEXT NOT NULL,                     -- Display name
  tagline TEXT,                           -- Short description

  -- Content
  description TEXT,                       -- Rich text description
  highlights TEXT[],                      -- Array of key attractions
  best_time_to_visit TEXT,
  duration TEXT,                          -- e.g., "Half day", "Full day"

  -- Location
  distance_from_nainital INTEGER,         -- In kilometers
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Media
  hero_image_url TEXT,
  gallery_urls TEXT[],
  emoji TEXT,                             -- e.g., 🏞️, 🌅, 🕉️

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Metadata
  display_order INTEGER DEFAULT 0,
  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_destinations_slug ON destinations(slug);
CREATE INDEX idx_destinations_popular ON destinations(is_popular) WHERE is_popular = TRUE;

-- ============================================================================
-- TABLE: packages
-- ============================================================================
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  type package_type NOT NULL,

  -- Pricing (Base prices in INR)
  base_price_sedan INTEGER NOT NULL,      -- Base price for sedan
  suv_multiplier DECIMAL(3,2) DEFAULT 1.40,    -- 40% more for SUV
  tempo_multiplier DECIMAL(3,2) DEFAULT 2.20,  -- 120% more for Tempo
  luxury_multiplier DECIMAL(3,2) DEFAULT 1.80, -- 80% more for Luxury

  -- Details
  duration TEXT,                          -- e.g., "8-10 hours"
  distance INTEGER,                       -- Total kilometers
  places_covered TEXT[],                  -- Array of destinations
  description TEXT,
  includes TEXT[],                        -- What's included
  excludes TEXT[],                        -- What's not included
  itinerary JSONB,                        -- Detailed hour-by-hour itinerary

  -- Destinations (for tours)
  destination_ids UUID[],                 -- Links to destinations table

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
  suitable_for TEXT[],                    -- e.g., ['families', 'couples', 'solo']

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Metadata
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_packages_slug ON packages(slug);
CREATE INDEX idx_packages_type ON packages(type);
CREATE INDEX idx_packages_popular ON packages(is_popular) WHERE is_popular = TRUE;
CREATE INDEX idx_packages_active ON packages(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- TABLE: seasons (Peak/Off-Peak Pricing)
-- ============================================================================
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL,                     -- e.g., "Peak Summer", "Diwali Rush"
  description TEXT,

  -- Date Range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Pricing
  price_multiplier DECIMAL(3,2) NOT NULL, -- e.g., 1.30 for 30% increase

  -- Recurrence (for annual events)
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT,                -- e.g., "Annual", "Every summer"

  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure valid date range
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Index
CREATE INDEX idx_seasons_dates ON seasons(start_date, end_date);
CREATE INDEX idx_seasons_active ON seasons(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- TABLE: availability (Daily Fleet Availability)
-- ============================================================================
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Date
  date DATE NOT NULL UNIQUE,

  -- Fleet Status
  total_fleet_size INTEGER DEFAULT 10,    -- Total cars in fleet
  cars_booked INTEGER DEFAULT 0,          -- How many are booked
  cars_available INTEGER GENERATED ALWAYS AS (total_fleet_size - cars_booked) STORED,

  -- Status (auto-computed based on cars_available)
  status availability_status DEFAULT 'available',

  -- Notes
  internal_notes TEXT,                    -- Admin notes (weddings, events, etc.)
  public_message TEXT,                    -- Optional message to show customers

  -- Google Calendar Sync
  synced_from_gcal BOOLEAN DEFAULT FALSE,
  gcal_event_id TEXT,
  last_synced_at TIMESTAMPTZ,

  -- Metadata
  is_blocked BOOLEAN DEFAULT FALSE,       -- Manually blocked by admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_booking_count CHECK (cars_booked >= 0 AND cars_booked <= total_fleet_size)
);

-- Index
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
  package_name TEXT NOT NULL,             -- Denormalized for history
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

  -- Pricing
  base_price INTEGER NOT NULL,
  vehicle_multiplier DECIMAL(3,2) NOT NULL,
  season_multiplier DECIMAL(3,2) DEFAULT 1.00,
  final_price INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',

  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'received', 'verified', 'refunded')),
  payment_method TEXT,                    -- 'upi', 'cash', 'card'
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

  -- Driver Assignment (if needed in future)
  assigned_driver_name TEXT,
  assigned_driver_phone TEXT,
  driver_assigned_at TIMESTAMPTZ,

  -- Trip Tracking
  trip_started_at TIMESTAMPTZ,
  trip_completed_at TIMESTAMPTZ,
  actual_distance INTEGER,                -- Kilometers

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by TEXT,                      -- 'customer' or 'admin'
  refund_amount INTEGER,
  refunded_at TIMESTAMPTZ,

  -- Metadata
  booking_source TEXT DEFAULT 'website',  -- 'website', 'whatsapp', 'phone', 'admin'
  admin_notes TEXT,
  internal_tags TEXT[],                   -- For admin organization
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
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

  -- Status Change
  from_status booking_status,
  to_status booking_status NOT NULL,

  -- Context
  changed_by UUID REFERENCES profiles(id),
  changed_by_name TEXT,                   -- Denormalized
  reason TEXT,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_booking_history_booking ON booking_status_history(booking_id);
CREATE INDEX idx_booking_history_created ON booking_status_history(created_at DESC);

-- ============================================================================
-- TABLE: waitlist (Velvet Rope Logic)
-- ============================================================================
-- When dates are sold out, customers can join waitlist
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Customer
  user_id UUID REFERENCES profiles(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_whatsapp TEXT,

  -- Desired Booking
  desired_date DATE NOT NULL,
  package_id UUID REFERENCES packages(id),
  package_name TEXT NOT NULL,
  vehicle_type vehicle_type NOT NULL,
  passengers INTEGER NOT NULL,

  -- Pricing (locked at time of waitlist)
  estimated_price INTEGER NOT NULL,

  -- Priority (lower number = higher priority)
  priority INTEGER DEFAULT 100,
  is_vip BOOLEAN DEFAULT FALSE,           -- VIP customers get priority

  -- Status
  status waitlist_status DEFAULT 'pending',

  -- Notification
  notified_at TIMESTAMPTZ,
  notification_method TEXT,               -- 'whatsapp', 'phone', 'email'
  expires_at TIMESTAMPTZ,                 -- Waitlist spot expires after X hours

  -- Conversion
  converted_to_booking_id UUID REFERENCES bookings(id),
  converted_at TIMESTAMPTZ,

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_waitlist_date ON waitlist(desired_date);
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_priority ON waitlist(desired_date, priority) WHERE status = 'pending';
CREATE INDEX idx_waitlist_active ON waitlist(status) WHERE status IN ('pending', 'notified');

-- ============================================================================
-- TABLE: reviews (Customer Testimonials)
-- ============================================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Customer
  user_id UUID REFERENCES profiles(id),
  booking_id UUID REFERENCES bookings(id),
  customer_name TEXT NOT NULL,
  customer_location TEXT,                 -- e.g., "Delhi", "Mumbai"

  -- Review
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT NOT NULL,

  -- Media
  photos TEXT[],                          -- Customer photos

  -- Response
  admin_response TEXT,
  admin_response_at TIMESTAMPTZ,

  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,      -- Show on homepage
  is_approved BOOLEAN DEFAULT FALSE,      -- Moderation

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
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

-- Insert default settings
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

-- Apply trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_updated_at BEFORE UPDATE ON availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update availability status based on cars_available
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
      booking_id,
      from_status,
      to_status,
      changed_by_name,
      notes
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      'System',
      'Status changed from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_booking_status_changes AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION log_booking_status_change();

-- Update user stats when booking is created/updated
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE profiles
    SET
      total_bookings = total_bookings + 1,
      total_spent = total_spent + NEW.final_price
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
    UPDATE profiles
    SET
      total_bookings = total_bookings + 1,
      total_spent = total_spent + NEW.final_price
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

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for content tables
CREATE POLICY "Public read access" ON vehicles FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read access" ON destinations FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read access" ON packages FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read access" ON seasons FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read access" ON availability FOR SELECT USING (TRUE);
CREATE POLICY "Public read approved reviews" ON reviews FOR SELECT USING (is_approved = TRUE);

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own waitlist entries
CREATE POLICY "Users can view own waitlist" ON waitlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create waitlist entries" ON waitlist FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own reviews
CREATE POLICY "Users can view own reviews" ON reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin full access (assuming admin role exists)
-- Note: You'll need to create admin users and grant them the admin role

-- ============================================================================
-- VIEWS (Useful Queries)
-- ============================================================================

-- Active vehicles by type
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

-- Upcoming bookings with details
CREATE VIEW upcoming_bookings AS
SELECT
  b.id,
  b.customer_name,
  b.customer_phone,
  b.booking_date,
  b.pickup_time,
  b.pickup_location,
  b.package_name,
  b.vehicle_type,
  v.name as vehicle_name,
  b.passengers,
  b.final_price,
  b.status,
  b.payment_status
FROM bookings b
LEFT JOIN vehicles v ON b.vehicle_id = v.id
WHERE b.booking_date >= CURRENT_DATE
  AND b.status NOT IN ('cancelled', 'completed')
ORDER BY b.booking_date, b.pickup_time;

-- Daily availability calendar (next 90 days)
CREATE VIEW availability_calendar AS
SELECT
  a.date,
  a.total_fleet_size,
  a.cars_booked,
  a.cars_available,
  a.status,
  a.is_blocked,
  COUNT(b.id) as confirmed_bookings_count
FROM availability a
LEFT JOIN bookings b ON b.booking_date = a.date AND b.status = 'confirmed'
WHERE a.date >= CURRENT_DATE AND a.date <= CURRENT_DATE + INTERVAL '90 days'
GROUP BY a.id, a.date, a.total_fleet_size, a.cars_booked, a.cars_available, a.status, a.is_blocked
ORDER BY a.date;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE vehicles IS 'Fleet management with Retro Pop aesthetic attributes';
COMMENT ON TABLE bookings IS 'Core booking lifecycle with status tracking';
COMMENT ON TABLE availability IS 'Daily fleet availability for booking system';
COMMENT ON TABLE waitlist IS 'Velvet Rope logic - customers waiting for sold-out dates';
COMMENT ON TABLE booking_status_history IS 'Audit trail of all booking status changes';
COMMENT ON TABLE seasons IS 'Peak/off-peak pricing periods';
COMMENT ON TABLE packages IS 'Tour packages and transfer offerings';
COMMENT ON TABLE destinations IS 'Tourist destinations and attractions';
COMMENT ON TABLE reviews IS 'Customer testimonials and ratings';
COMMENT ON TABLE profiles IS 'User profiles linked to Supabase Auth';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
