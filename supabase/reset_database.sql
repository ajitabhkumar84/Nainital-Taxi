-- ============================================================================
-- RESET DATABASE - Run this BEFORE schema_enhanced.sql if you get errors
-- ============================================================================
-- WARNING: This will DELETE all existing data!
-- Only run this if you want to start fresh
-- ============================================================================

-- Drop all tables (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS booking_status_history CASCADE;
DROP TABLE IF EXISTS waitlist CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS pricing CASCADE;
DROP TABLE IF EXISTS booking_blackout CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS destinations CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;

-- Drop all views
DROP VIEW IF EXISTS active_vehicles_summary CASCADE;
DROP VIEW IF EXISTS upcoming_bookings CASCADE;
DROP VIEW IF EXISTS availability_calendar CASCADE;

-- Drop all custom types (enums)
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS package_type CASCADE;
DROP TYPE IF EXISTS vehicle_type CASCADE;
DROP TYPE IF EXISTS vehicle_status CASCADE;
DROP TYPE IF EXISTS availability_status CASCADE;
DROP TYPE IF EXISTS waitlist_status CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_availability_status() CASCADE;
DROP FUNCTION IF EXISTS log_booking_status_change() CASCADE;
DROP FUNCTION IF EXISTS update_user_stats() CASCADE;
DROP FUNCTION IF EXISTS get_season_for_date(DATE) CASCADE;
DROP FUNCTION IF EXISTS calculate_package_price(UUID, vehicle_type, DATE) CASCADE;
DROP FUNCTION IF EXISTS is_booking_allowed(DATE) CASCADE;
DROP FUNCTION IF EXISTS get_blackout_message(DATE) CASCADE;
DROP FUNCTION IF EXISTS increment_cars_booked(DATE, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS decrement_cars_booked(DATE, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_next_waitlist_entry(DATE) CASCADE;
DROP FUNCTION IF EXISTS notify_waitlist_on_availability_change() CASCADE;
DROP FUNCTION IF EXISTS get_booking_statistics(DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_monthly_revenue(INTEGER, INTEGER) CASCADE;

-- Success message
SELECT 'Database reset complete! Now run schema_enhanced.sql' AS status;
