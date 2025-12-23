-- ============================================================================
-- CLEANUP SCRIPT - Drop all existing Nainital Taxi database objects
-- ============================================================================
-- Run this FIRST to clean your database before running schema_final.sql
-- WARNING: This will delete ALL data!
-- ============================================================================

-- Drop all tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS payment_logs CASCADE;
DROP TABLE IF EXISTS waitlist CASCADE;
DROP TABLE IF EXISTS availability_blocks CASCADE;
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS pricing CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS destinations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS gcal_sync_log CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- Drop all enums
DROP TYPE IF EXISTS waitlist_status CASCADE;
DROP TYPE IF EXISTS availability_status CASCADE;
DROP TYPE IF EXISTS vehicle_status CASCADE;
DROP TYPE IF EXISTS vehicle_type CASCADE;
DROP TYPE IF EXISTS package_type CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS increment_booking_count() CASCADE;
DROP FUNCTION IF EXISTS update_availability_status() CASCADE;
DROP FUNCTION IF EXISTS update_profile_stats() CASCADE;
DROP FUNCTION IF EXISTS get_current_season(DATE) CASCADE;
DROP FUNCTION IF EXISTS get_price(UUID, vehicle_type, DATE) CASCADE;
DROP FUNCTION IF EXISTS check_availability(DATE) CASCADE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database cleanup completed successfully!';
  RAISE NOTICE 'You can now run schema_final.sql';
END $$;
