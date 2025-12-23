-- ============================================================================
-- ADDITIONAL DATABASE FUNCTIONS
-- ============================================================================
-- Helper functions for common operations
-- Run these after schema.sql if needed
-- ============================================================================

-- ============================================================================
-- FUNCTION: Increment cars booked for a date
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_cars_booked(booking_date DATE)
RETURNS void AS $$
BEGIN
  -- Check if availability record exists
  IF EXISTS (SELECT 1 FROM availability WHERE date = booking_date) THEN
    -- Update existing record
    UPDATE availability
    SET cars_booked = cars_booked + 1
    WHERE date = booking_date;
  ELSE
    -- Create new record with 1 car booked
    INSERT INTO availability (date, total_fleet_size, cars_booked)
    VALUES (booking_date, 10, 1);
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_cars_booked IS 'Increment cars booked count for a specific date';

-- ============================================================================
-- FUNCTION: Decrement cars booked (for cancellations)
-- ============================================================================

CREATE OR REPLACE FUNCTION decrement_cars_booked(booking_date DATE)
RETURNS void AS $$
BEGIN
  UPDATE availability
  SET cars_booked = GREATEST(cars_booked - 1, 0)
  WHERE date = booking_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION decrement_cars_booked IS 'Decrement cars booked count (for cancellations)';

-- ============================================================================
-- FUNCTION: Get availability status for date range
-- ============================================================================

CREATE OR REPLACE FUNCTION get_availability_range(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  date DATE,
  total_fleet_size INTEGER,
  cars_booked INTEGER,
  cars_available INTEGER,
  status availability_status,
  is_blocked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.date,
    a.total_fleet_size,
    a.cars_booked,
    a.cars_available,
    a.status,
    a.is_blocked
  FROM availability a
  WHERE a.date >= start_date AND a.date <= end_date
  ORDER BY a.date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_availability_range IS 'Get availability for a date range';

-- ============================================================================
-- FUNCTION: Get package price for specific vehicle and date
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_package_price(
  package_id UUID,
  vehicle_type_input vehicle_type,
  booking_date DATE
)
RETURNS TABLE (
  base_price INTEGER,
  vehicle_multiplier DECIMAL,
  season_multiplier DECIMAL,
  final_price INTEGER
) AS $$
DECLARE
  pkg RECORD;
  season_mult DECIMAL;
  vehicle_mult DECIMAL;
  base_p INTEGER;
  final_p INTEGER;
BEGIN
  -- Get package details
  SELECT
    base_price_sedan,
    suv_multiplier,
    tempo_multiplier,
    luxury_multiplier
  INTO pkg
  FROM packages
  WHERE id = package_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Package not found';
  END IF;

  base_p := pkg.base_price_sedan;

  -- Determine vehicle multiplier
  CASE vehicle_type_input
    WHEN 'sedan' THEN
      vehicle_mult := 1.0;
    WHEN 'suv' THEN
      vehicle_mult := pkg.suv_multiplier;
    WHEN 'tempo_traveller' THEN
      vehicle_mult := pkg.tempo_multiplier;
    WHEN 'luxury' THEN
      vehicle_mult := pkg.luxury_multiplier;
    ELSE
      vehicle_mult := 1.0;
  END CASE;

  -- Get season multiplier
  SELECT s.price_multiplier INTO season_mult
  FROM seasons s
  WHERE s.is_active = TRUE
    AND s.start_date <= booking_date
    AND s.end_date >= booking_date
  LIMIT 1;

  -- Default to 1.0 if no season found
  season_mult := COALESCE(season_mult, 1.0);

  -- Calculate final price
  final_p := ROUND(base_p * vehicle_mult * season_mult);

  -- Return results
  RETURN QUERY
  SELECT
    base_p,
    vehicle_mult,
    season_mult,
    final_p;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_package_price IS 'Calculate total price with all multipliers';

-- ============================================================================
-- FUNCTION: Get next available waitlist customer
-- ============================================================================

CREATE OR REPLACE FUNCTION get_next_waitlist_entry(date_input DATE)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  package_name TEXT,
  vehicle_type vehicle_type,
  passengers INTEGER,
  priority INTEGER,
  is_vip BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.customer_name,
    w.customer_phone,
    w.customer_email,
    w.package_name,
    w.vehicle_type,
    w.passengers,
    w.priority,
    w.is_vip
  FROM waitlist w
  WHERE w.desired_date = date_input
    AND w.status = 'pending'
    AND (w.expires_at IS NULL OR w.expires_at > NOW())
  ORDER BY
    w.is_vip DESC,
    w.priority ASC,
    w.created_at ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_next_waitlist_entry IS 'Get highest priority waitlist entry for a date';

-- ============================================================================
-- FUNCTION: Notify waitlist customers when spot opens
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_waitlist_on_availability_change()
RETURNS TRIGGER AS $$
DECLARE
  next_customer RECORD;
BEGIN
  -- Only trigger when cars become available (from sold_out or limited to available/limited)
  IF NEW.cars_available > OLD.cars_available THEN
    -- Get next waitlist customer
    SELECT * INTO next_customer
    FROM get_next_waitlist_entry(NEW.date);

    IF FOUND THEN
      -- Update waitlist entry to 'notified' status
      UPDATE waitlist
      SET
        status = 'notified',
        notified_at = NOW(),
        notification_method = 'system',
        expires_at = NOW() + INTERVAL '24 hours'
      WHERE id = next_customer.id;

      -- In production, this would trigger an actual notification (email/SMS/WhatsApp)
      -- For now, just log it
      RAISE NOTICE 'Notification sent to % for date %', next_customer.customer_name, NEW.date;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for waitlist notification
DROP TRIGGER IF EXISTS trigger_notify_waitlist ON availability;
CREATE TRIGGER trigger_notify_waitlist
  AFTER UPDATE ON availability
  FOR EACH ROW
  WHEN (NEW.cars_available > OLD.cars_available)
  EXECUTE FUNCTION notify_waitlist_on_availability_change();

COMMENT ON FUNCTION notify_waitlist_on_availability_change IS 'Auto-notify waitlist customers when availability opens';

-- ============================================================================
-- FUNCTION: Get booking statistics for admin dashboard
-- ============================================================================

CREATE OR REPLACE FUNCTION get_booking_statistics(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_bookings BIGINT,
  confirmed_bookings BIGINT,
  pending_bookings BIGINT,
  cancelled_bookings BIGINT,
  total_revenue INTEGER,
  average_booking_value INTEGER,
  most_popular_package TEXT,
  most_used_vehicle_type vehicle_type
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
    COUNT(*) FILTER (WHERE status IN ('pending', 'payment_pending')) as pending_bookings,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
    COALESCE(SUM(final_price) FILTER (WHERE status = 'confirmed'), 0)::INTEGER as total_revenue,
    COALESCE(AVG(final_price) FILTER (WHERE status = 'confirmed'), 0)::INTEGER as average_booking_value,
    (SELECT package_name FROM bookings WHERE booking_date BETWEEN start_date AND end_date GROUP BY package_name ORDER BY COUNT(*) DESC LIMIT 1) as most_popular_package,
    (SELECT vehicle_type FROM bookings WHERE booking_date BETWEEN start_date AND end_date GROUP BY vehicle_type ORDER BY COUNT(*) DESC LIMIT 1) as most_used_vehicle_type
  FROM bookings
  WHERE booking_date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_booking_statistics IS 'Get aggregated booking statistics for dashboard';

-- ============================================================================
-- FUNCTION: Auto-expire old waitlist entries
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_old_waitlist_entries()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE waitlist
  SET status = 'expired'
  WHERE status = 'notified'
    AND expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;

  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_old_waitlist_entries IS 'Expire waitlist entries past expiration time';

-- ============================================================================
-- FUNCTION: Get revenue by month (for reporting)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_monthly_revenue(year_input INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS TABLE (
  month INTEGER,
  month_name TEXT,
  total_bookings BIGINT,
  total_revenue INTEGER,
  average_booking_value INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(MONTH FROM booking_date)::INTEGER as month,
    TO_CHAR(booking_date, 'Month') as month_name,
    COUNT(*) as total_bookings,
    SUM(final_price)::INTEGER as total_revenue,
    AVG(final_price)::INTEGER as average_booking_value
  FROM bookings
  WHERE EXTRACT(YEAR FROM booking_date) = year_input
    AND status = 'confirmed'
  GROUP BY EXTRACT(MONTH FROM booking_date), TO_CHAR(booking_date, 'Month')
  ORDER BY month;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_monthly_revenue IS 'Get monthly revenue breakdown for a year';

-- ============================================================================
-- Grant necessary permissions
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_cars_booked TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_cars_booked TO authenticated;
GRANT EXECUTE ON FUNCTION get_availability_range TO authenticated, anon;
GRANT EXECUTE ON FUNCTION calculate_package_price TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_next_waitlist_entry TO authenticated;

-- Admin-only functions
-- Note: You'll need to create proper admin role policies
GRANT EXECUTE ON FUNCTION get_booking_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_waitlist_entries TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_revenue TO authenticated;

-- ============================================================================
-- END OF FUNCTIONS
-- ============================================================================
