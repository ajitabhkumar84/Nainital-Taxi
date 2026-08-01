-- Run this manually against Supabase (SQL editor or CLI) before testing the
-- "outside India" phone fallback end-to-end — the create-booking API will
-- fail on missing column until this is applied.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_country_code TEXT NOT NULL DEFAULT '91';
