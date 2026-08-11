-- Fix: is_booking_allowed() only checked the booking_blackout date-range
-- table and ignored availability.is_blocked (the single-date flag set via
-- /admin/availability). This left blocked dates bookable through any caller
-- of the RPC. Safe to re-run — CREATE OR REPLACE is idempotent.
--
-- Paste this into the Supabase SQL editor (Dashboard > SQL Editor > New query)
-- and run it once. See also the matching update in schema_enhanced.sql.

CREATE OR REPLACE FUNCTION is_booking_allowed(check_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
  blackout_count INTEGER;
  date_is_blocked BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO blackout_count
  FROM booking_blackout
  WHERE is_active = TRUE
    AND start_date <= check_date
    AND end_date >= check_date;

  SELECT is_blocked INTO date_is_blocked
  FROM availability
  WHERE date = check_date;

  RETURN (blackout_count = 0) AND (COALESCE(date_is_blocked, FALSE) = FALSE);
END;
$$ LANGUAGE plpgsql;
