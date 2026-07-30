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
