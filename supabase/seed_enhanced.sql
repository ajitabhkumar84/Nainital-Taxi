-- ============================================================================
-- NAINITAL TAXI - ENHANCED SEED DATA
-- ============================================================================
-- YOUR 7 PACKAGES WITH ACTUAL PRICING
-- Multiple season periods support
-- Booking blackout dates examples
-- ============================================================================

-- ============================================================================
-- VEHICLES (10 vehicles across 4 categories)
-- ============================================================================

INSERT INTO vehicles (
  name, nickname, registration_number, vehicle_type, status,
  model_name, capacity, luggage_capacity, has_ac, has_music_system,
  primary_color, color_hex, emoji, personality_trait, tagline,
  featured_image_url, is_featured, is_active, display_order
) VALUES
  -- SEDAN (Dzire, Amaze, Xcent)
  ('Sunshine Dzire 🌞', 'Sunny', 'UK07AB1234', 'sedan', 'available',
   'Maruti Dzire', 4, 2, TRUE, TRUE,
   'Sunshine Yellow', '#FFD93D', '🚕', 'Cheerful & Economical', 'Your budget-friendly adventure partner!',
   'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800', TRUE, TRUE, 1),

  ('Teal Amaze ⚡', 'Thunder', 'UK07CD5678', 'sedan', 'available',
   'Honda Amaze', 4, 2, TRUE, TRUE,
   'Pop Teal', '#4D96FF', '🚗', 'Swift & Reliable', 'Mountains await!',
   'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800', FALSE, TRUE, 2),

  ('Coral Xcent 🌸', 'Coral', 'UK07EF9012', 'sedan', 'available',
   'Hyundai Xcent', 4, 2, TRUE, TRUE,
   'Pop Coral', '#FF6B6B', '🚙', 'Cozy & Comfortable', 'Ride in style!',
   'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800', FALSE, TRUE, 3),

  -- SUV NORMAL (Ertiga, Triber, Xylo, Tavera)
  ('Family Ertiga 👨‍👩‍👧‍👦', 'Family', 'UK07GH3456', 'suv_normal', 'available',
   'Maruti Ertiga', 7, 3, TRUE, TRUE,
   'Pearl White', '#F8F9FA', '🚙', 'Family-Friendly & Spacious', 'Perfect for your family adventure!',
   'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800', TRUE, TRUE, 4),

  ('Adventure Triber 🏔️', 'Adventurer', 'UK07IJ7890', 'suv_normal', 'available',
   'Renault Triber', 7, 3, TRUE, TRUE,
   'Mountain Blue', '#4A90E2', '🚐', 'Versatile & Modern', 'Explore with flexibility!',
   'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800', FALSE, TRUE, 5),

  ('Classic Tavera 🎯', 'Classic', 'UK07KL1234', 'suv_normal', 'available',
   'Chevrolet Tavera', 9, 4, TRUE, FALSE,
   'Silver Gray', '#C0C0C0', '🚐', 'Sturdy & Reliable', 'Built for the mountains!',
   'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800', FALSE, TRUE, 6),

  -- SUV DELUXE (Innova, Marazzo)
  ('Premium Innova ⭐', 'Premium', 'UK07MN5678', 'suv_deluxe', 'available',
   'Toyota Innova', 7, 4, TRUE, TRUE,
   'Champagne Gold', '#D4A574', '🚙', 'Comfortable & Premium', 'Luxury on wheels!',
   'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800', TRUE, TRUE, 7),

  ('Deluxe Marazzo 💎', 'Deluxe', 'UK07OP9012', 'suv_deluxe', 'available',
   'Mahindra Marazzo', 8, 4, TRUE, TRUE,
   'Royal Blue', '#1E3A8A', '🚐', 'Spacious & Elegant', 'Your premium mountain ride!',
   'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800', FALSE, TRUE, 8),

  -- SUV LUXURY (Innova Crysta)
  ('Crysta Royale 👑', 'Royale', 'UK07QR3456', 'suv_luxury', 'available',
   'Toyota Innova Crysta', 7, 4, TRUE, TRUE,
   'Pearl White', '#FFFFFF', '🚘', 'Luxurious & Sophisticated', 'Travel like royalty!',
   'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800', TRUE, TRUE, 9),

  ('Elite Crysta 🏔️', 'Elite', 'UK07ST7890', 'suv_luxury', 'available',
   'Toyota Innova Crysta', 7, 4, TRUE, TRUE,
   'Jet Black', '#000000', '🚙', 'Elite & Powerful', 'Ultimate comfort!',
   'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800', FALSE, TRUE, 10);

-- ============================================================================
-- DESTINATIONS
-- ============================================================================

INSERT INTO destinations (
  slug, name, tagline, description, highlights, best_time_to_visit, duration,
  distance_from_nainital, hero_image_url, emoji, is_popular, is_active, display_order
) VALUES
  ('bhimtal', 'Bhimtal', 'Serenity by the Lake',
   'A picturesque lake town with a peaceful island temple.',
   ARRAY['Island Temple', 'Boating', 'Butterfly Museum', 'Victoria Dam'],
   'March to June, September to November', 'Half Day (4-5 hours)', 22,
   'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200', '🏞️', TRUE, TRUE, 1),

  ('naukuchiatal', 'Naukuchiatal', 'The Nine-Cornered Wonder',
   'A mystical lake with nine corners, surrounded by hills.',
   ARRAY['Nine-Cornered Lake', 'Bird Watching', 'Paragliding', 'Hanging Bridge'],
   'Year Round', 'Half Day (3-4 hours)', 26,
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', '🌅', FALSE, TRUE, 2),

  ('kainchi-dham', 'Kainchi Dham', 'Spiritual Serenity',
   'Famous ashram of Neem Karoli Baba.',
   ARRAY['Neem Karoli Baba Ashram', 'Temple Complex', 'Meditation Spots'],
   'Year Round', 'Half Day (3-4 hours)', 17,
   'https://images.unsplash.com/photo-1590935217281-8f102120d683?w=1200', '🕉️', TRUE, TRUE, 3),

  ('mukteshwar', 'Mukteshwar', 'Himalayan Paradise',
   'Scenic hill station with ancient temples and fruit orchards.',
   ARRAY['Mukteshwar Temple', 'Chauli Ki Jali', 'Fruit Orchards', 'Mountain Views'],
   'Year Round', 'Full Day (8-10 hours)', 51,
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', '⛰️', TRUE, TRUE, 4),

  ('ranikhet', 'Ranikhet', 'Queen''s Meadow',
   'Peaceful cantonment town with pine forests and golf course.',
   ARRAY['Golf Course', 'Chaubatia Gardens', 'Jhula Devi Temple', 'Army Museum'],
   'March to June, September to November', 'Full Day (9-10 hours)', 62,
   'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200', '🌲', TRUE, TRUE, 5);

-- ============================================================================
-- PACKAGES (YOUR 7 ACTUAL PACKAGES)
-- ============================================================================

INSERT INTO packages (
  slug, title, type, duration, distance, places_covered, description, includes, excludes,
  destination_ids, image_url, is_popular, is_seasonal, availability_status,
  min_passengers, suitable_for, is_active, display_order
) VALUES
  -- 1. Nainital Darshan
  ('nainital-darshan', 'Nainital Darshan', 'tour',
   '8-10 hours', 40,
   ARRAY['Naini Lake', 'Mall Road', 'Snow View Point', 'Naina Devi Temple', 'Tiffin Top', 'Cave Garden'],
   'Complete city tour covering all major attractions of Nainital.',
   ARRAY['Experienced Driver', 'Fuel Charges', 'Parking Fees', 'Hill Permits'],
   ARRAY['Entry Fees', 'Ropeway Charges', 'Food & Beverages'],
   NULL, 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
   TRUE, FALSE, 'available', 1, ARRAY['families', 'couples', 'solo', 'groups'], TRUE, 1),

  -- 2. Lake Tour + Kainchi Dham
  ('lake-tour-kainchi-dham', 'Lake Tour + Kainchi Dham', 'tour',
   '7-8 hours', 70,
   ARRAY['Bhimtal Lake', 'Naukuchiatal', 'Kainchi Dham Ashram', 'Island Temple'],
   'Beautiful lake tour combined with spiritual visit to Kainchi Dham.',
   ARRAY['Experienced Driver', 'Fuel Charges', 'Parking Fees', 'Hill Permits'],
   ARRAY['Boating Charges', 'Entry Fees', 'Food & Beverages'],
   (SELECT ARRAY_AGG(id) FROM destinations WHERE slug IN ('bhimtal', 'naukuchiatal', 'kainchi-dham')),
   'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
   TRUE, FALSE, 'available', 1, ARRAY['families', 'couples', 'spiritual'], TRUE, 2),

  -- 3. Mukteshwar Day Tour
  ('mukteshwar-day-tour', 'Mukteshwar Day Tour', 'tour',
   '9-10 hours', 102,
   ARRAY['Mukteshwar Temple', 'Chauli Ki Jali', 'Fruit Orchards', 'Scenic Viewpoints'],
   'Full day excursion to the scenic hill station of Mukteshwar.',
   ARRAY['Experienced Driver', 'Fuel Charges', 'Parking Fees', 'Hill Permits'],
   ARRAY['Entry Fees', 'Food & Beverages'],
   (SELECT ARRAY[id] FROM destinations WHERE slug = 'mukteshwar'),
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
   TRUE, FALSE, 'available', 1, ARRAY['families', 'couples', 'nature-lovers'], TRUE, 3),

  -- 4. Ranikhet Day tour + Kainchi Dham
  ('ranikhet-kainchi-dham', 'Ranikhet Day tour + Kainchi Dham', 'tour',
   '10-11 hours', 124,
   ARRAY['Ranikhet', 'Chaubatia Gardens', 'Jhula Devi Temple', 'Kainchi Dham'],
   'Explore Ranikhet''s charm with a spiritual stop at Kainchi Dham.',
   ARRAY['Experienced Driver', 'Fuel Charges', 'Parking Fees', 'Hill Permits'],
   ARRAY['Entry Fees', 'Food & Beverages'],
   (SELECT ARRAY_AGG(id) FROM destinations WHERE slug IN ('ranikhet', 'kainchi-dham')),
   'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
   TRUE, FALSE, 'available', 1, ARRAY['families', 'couples', 'spiritual'], TRUE, 4),

  -- 5. Neem Karoli 4 Dham Package
  ('neem-karoli-4-dham', 'Neem Karoli 4 Dham Package', 'tour',
   '8-9 hours', 80,
   ARRAY['Kainchi Dham', 'Kakrighat', 'Vrindavan Ashram', 'Hanuman Garhi'],
   'Complete spiritual journey covering all 4 dhams associated with Neem Karoli Baba.',
   ARRAY['Experienced Driver', 'Fuel Charges', 'Parking Fees'],
   ARRAY['Donation (Optional)', 'Food & Beverages'],
   (SELECT ARRAY[id] FROM destinations WHERE slug = 'kainchi-dham'),
   'https://images.unsplash.com/photo-1590935217281-8f102120d683?w=800',
   TRUE, TRUE, 'available', 1, ARRAY['spiritual', 'families'], TRUE, 5),

  -- 6. Kathgodam to Nainital Drop
  ('kathgodam-nainital-drop', 'Kathgodam to Nainital Drop', 'transfer',
   '1.5 hours', 35,
   ARRAY['Kathgodam Railway Station', 'Nainital'],
   'Quick transfer from Kathgodam Railway Station to Nainital.',
   ARRAY['Station Pickup', 'Experienced Driver', 'Fuel Charges'],
   ARRAY['Station Parking (if waiting)'],
   NULL, 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800',
   TRUE, FALSE, 'available', 1, ARRAY['families', 'couples', 'solo'], TRUE, 6),

  -- 7. Pantnagar to Nainital Drop
  ('pantnagar-nainital-drop', 'Pantnagar to Nainital Drop', 'transfer',
   '2 hours', 65,
   ARRAY['Pantnagar Airport', 'Nainital'],
   'Direct transfer from Pantnagar Airport to Nainital with meet & greet.',
   ARRAY['Meet & Greet', 'Experienced Driver', 'Fuel Charges', 'Tolls'],
   ARRAY['Airport Parking (if waiting)'],
   NULL, 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
   TRUE, FALSE, 'available', 1, ARRAY['families', 'couples', 'solo', 'business'], TRUE, 7);

-- ============================================================================
-- SEASONS (MULTIPLE PERIODS SUPPORT)
-- ============================================================================
-- Base off-season (covers entire year by default)
INSERT INTO seasons (name, description, start_date, end_date, priority, is_active) VALUES
  ('Off-Season', 'Year-round regular pricing', '2025-01-01', '2025-12-31', 0, TRUE);

-- Main peak season (Summer)
INSERT INTO seasons (name, description, start_date, end_date, priority, is_active) VALUES
  ('Season', 'Summer peak season', '2025-04-15', '2025-06-30', 10, TRUE);

-- Long weekends / special periods (higher priority overrides off-season)
INSERT INTO seasons (name, description, start_date, end_date, priority, is_active) VALUES
  ('Season', 'Republic Day long weekend', '2025-01-25', '2025-01-26', 20, TRUE),
  ('Season', 'Holi long weekend', '2025-03-14', '2025-03-16', 20, TRUE),
  ('Season', 'Diwali period', '2025-10-20', '2025-11-05', 20, TRUE),
  ('Season', 'Christmas - New Year', '2025-12-20', '2026-01-05', 20, TRUE);

COMMENT ON TABLE seasons IS 'Multiple rows with same season name allowed. Higher priority wins when dates overlap.';

-- ============================================================================
-- BOOKING BLACKOUT DATES (EXAMPLES)
-- ============================================================================
-- Example: Block online booking for Jan 20-30
INSERT INTO booking_blackout (start_date, end_date, reason, show_message, is_active) VALUES
  ('2025-01-20', '2025-01-30', 'Peak demand - advance planning required',
   'Online booking unavailable for these dates. Please call +918445206116 or WhatsApp us for availability and booking.',
   FALSE);  -- Set to FALSE by default - activate when needed

-- Example: Block during Diwali
INSERT INTO booking_blackout (start_date, end_date, reason, show_message, is_active) VALUES
  ('2025-10-28', '2025-11-02', 'Diwali rush - confirmed bookings only',
   'Due to high demand during Diwali, online booking is closed. Call us at +918445206116 for availability.',
   FALSE);  -- Set to FALSE by default

COMMENT ON TABLE booking_blackout IS 'Set is_active = TRUE to enable blackout. Users see prices but cannot book online.';

-- ============================================================================
-- PRICING (YOUR ACTUAL RATES FROM THE IMAGE)
-- ============================================================================

DO $$
DECLARE
  pkg1_id UUID;  -- Nainital Darshan
  pkg2_id UUID;  -- Lake Tour + Kainchi Dham
  pkg3_id UUID;  -- Mukteshwar Day Tour
  pkg4_id UUID;  -- Ranikhet + Kainchi Dham
  pkg5_id UUID;  -- Neem Karoli 4 Dham
  pkg6_id UUID;  -- Kathgodam to Nainital
  pkg7_id UUID;  -- Pantnagar to Nainital
BEGIN
  -- Get package IDs
  SELECT id INTO pkg1_id FROM packages WHERE slug = 'nainital-darshan';
  SELECT id INTO pkg2_id FROM packages WHERE slug = 'lake-tour-kainchi-dham';
  SELECT id INTO pkg3_id FROM packages WHERE slug = 'mukteshwar-day-tour';
  SELECT id INTO pkg4_id FROM packages WHERE slug = 'ranikhet-kainchi-dham';
  SELECT id INTO pkg5_id FROM packages WHERE slug = 'neem-karoli-4-dham';
  SELECT id INTO pkg6_id FROM packages WHERE slug = 'kathgodam-nainital-drop';
  SELECT id INTO pkg7_id FROM packages WHERE slug = 'pantnagar-nainital-drop';

  -- ======================================
  -- 1. NAINITAL DARSHAN
  -- ======================================
  INSERT INTO pricing (package_id, vehicle_type, season_name, price, notes) VALUES
    (pkg1_id, 'sedan', 'Off-Season', 2500, 'Sedan off-season'),
    (pkg1_id, 'suv_normal', 'Off-Season', 3300, 'SUV Basic off-season'),
    (pkg1_id, 'suv_deluxe', 'Off-Season', 3700, 'SUV Deluxe off-season'),
    (pkg1_id, 'suv_luxury', 'Off-Season', 4000, 'SUV Luxury off-season'),

    (pkg1_id, 'sedan', 'Season', 3000, 'Sedan peak'),
    (pkg1_id, 'suv_normal', 'Season', 3800, 'SUV Basic peak'),
    (pkg1_id, 'suv_deluxe', 'Season', 4200, 'SUV Deluxe peak'),
    (pkg1_id, 'suv_luxury', 'Season', 4500, 'SUV Luxury peak');

  -- ======================================
  -- 2. LAKE TOUR + KAINCHI DHAM
  -- ======================================
  INSERT INTO pricing (package_id, vehicle_type, season_name, price, notes) VALUES
    (pkg2_id, 'sedan', 'Off-Season', 3000, 'Sedan off-season'),
    (pkg2_id, 'suv_normal', 'Off-Season', 3500, 'SUV Basic off-season'),
    (pkg2_id, 'suv_deluxe', 'Off-Season', 4000, 'SUV Deluxe off-season'),
    (pkg2_id, 'suv_luxury', 'Off-Season', 4500, 'SUV Luxury off-season'),

    (pkg2_id, 'sedan', 'Season', 3500, 'Sedan peak'),
    (pkg2_id, 'suv_normal', 'Season', 4200, 'SUV Basic peak'),
    (pkg2_id, 'suv_deluxe', 'Season', 4500, 'SUV Deluxe peak'),
    (pkg2_id, 'suv_luxury', 'Season', 5000, 'SUV Luxury peak');

  -- ======================================
  -- 3. MUKTESHWAR DAY TOUR
  -- ======================================
  INSERT INTO pricing (package_id, vehicle_type, season_name, price, notes) VALUES
    (pkg3_id, 'sedan', 'Off-Season', 3200, 'Sedan off-season'),
    (pkg3_id, 'suv_normal', 'Off-Season', 3800, 'SUV Basic off-season'),
    (pkg3_id, 'suv_deluxe', 'Off-Season', 4000, 'SUV Deluxe off-season'),
    (pkg3_id, 'suv_luxury', 'Off-Season', 4500, 'SUV Luxury off-season'),

    (pkg3_id, 'sedan', 'Season', 3500, 'Sedan peak'),
    (pkg3_id, 'suv_normal', 'Season', 4200, 'SUV Basic peak'),
    (pkg3_id, 'suv_deluxe', 'Season', 4500, 'SUV Deluxe peak'),
    (pkg3_id, 'suv_luxury', 'Season', 5000, 'SUV Luxury peak');

  -- ======================================
  -- 4. RANIKHET DAY TOUR + KAINCHI DHAM
  -- ======================================
  INSERT INTO pricing (package_id, vehicle_type, season_name, price, notes) VALUES
    (pkg4_id, 'sedan', 'Off-Season', 3500, 'Sedan off-season'),
    (pkg4_id, 'suv_normal', 'Off-Season', 4000, 'SUV Basic off-season'),
    (pkg4_id, 'suv_deluxe', 'Off-Season', 4200, 'SUV Deluxe off-season'),
    (pkg4_id, 'suv_luxury', 'Off-Season', 4800, 'SUV Luxury off-season'),

    (pkg4_id, 'sedan', 'Season', 3800, 'Sedan peak'),
    (pkg4_id, 'suv_normal', 'Season', 4400, 'SUV Basic peak'),
    (pkg4_id, 'suv_deluxe', 'Season', 4700, 'SUV Deluxe peak'),
    (pkg4_id, 'suv_luxury', 'Season', 5000, 'SUV Luxury peak');

  -- ======================================
  -- 5. NEEM KAROLI 4 DHAM PACKAGE
  -- ======================================
  INSERT INTO pricing (package_id, vehicle_type, season_name, price, notes) VALUES
    (pkg5_id, 'sedan', 'Off-Season', 3000, 'Sedan off-season'),
    (pkg5_id, 'suv_normal', 'Off-Season', 3800, 'SUV Basic off-season'),
    (pkg5_id, 'suv_deluxe', 'Off-Season', 4000, 'SUV Deluxe off-season'),
    (pkg5_id, 'suv_luxury', 'Off-Season', 4500, 'SUV Luxury off-season'),

    (pkg5_id, 'sedan', 'Season', 3500, 'Sedan peak'),
    (pkg5_id, 'suv_normal', 'Season', 4200, 'SUV Basic peak'),
    (pkg5_id, 'suv_deluxe', 'Season', 4500, 'SUV Deluxe peak'),
    (pkg5_id, 'suv_luxury', 'Season', 5000, 'SUV Luxury peak');

  -- ======================================
  -- 6. KATHGODAM TO NAINITAL DROP
  -- ======================================
  INSERT INTO pricing (package_id, vehicle_type, season_name, price, notes) VALUES
    (pkg6_id, 'sedan', 'Off-Season', 1500, 'Sedan off-season'),
    (pkg6_id, 'suv_normal', 'Off-Season', 1800, 'SUV Basic off-season'),
    (pkg6_id, 'suv_deluxe', 'Off-Season', 2000, 'SUV Deluxe off-season'),
    (pkg6_id, 'suv_luxury', 'Off-Season', 2500, 'SUV Luxury off-season'),

    (pkg6_id, 'sedan', 'Season', 1700, 'Sedan peak'),
    (pkg6_id, 'suv_normal', 'Season', 2200, 'SUV Basic peak'),
    (pkg6_id, 'suv_deluxe', 'Season', 2500, 'SUV Deluxe peak'),
    (pkg6_id, 'suv_luxury', 'Season', 3000, 'SUV Luxury peak');

  -- ======================================
  -- 7. PANTNAGAR TO NAINITAL DROP
  -- ======================================
  INSERT INTO pricing (package_id, vehicle_type, season_name, price, notes) VALUES
    (pkg7_id, 'sedan', 'Off-Season', 2800, 'Sedan off-season'),
    (pkg7_id, 'suv_normal', 'Off-Season', 3500, 'SUV Basic off-season'),
    (pkg7_id, 'suv_deluxe', 'Off-Season', 4000, 'SUV Deluxe off-season'),
    (pkg7_id, 'suv_luxury', 'Off-Season', 4500, 'SUV Luxury off-season'),

    (pkg7_id, 'sedan', 'Season', 3300, 'Sedan peak'),
    (pkg7_id, 'suv_normal', 'Season', 4200, 'SUV Basic peak'),
    (pkg7_id, 'suv_deluxe', 'Season', 4500, 'SUV Deluxe peak'),
    (pkg7_id, 'suv_luxury', 'Season', 5000, 'SUV Luxury peak');

END $$;

-- ============================================================================
-- AVAILABILITY (Next 90 Days)
-- ============================================================================

INSERT INTO availability (date, total_fleet_size, cars_booked, is_blocked)
SELECT
  (CURRENT_DATE + i)::date,
  10,
  0,
  FALSE
FROM generate_series(0, 90) as i;

-- ============================================================================
-- REVIEWS
-- ============================================================================

INSERT INTO reviews (
  customer_name, customer_location, rating, title, review_text,
  is_verified, is_featured, is_approved
) VALUES
  ('Rahul Sharma', 'Delhi', 5, 'Amazing service!',
   'Driver was punctual, car was spotless. Highly recommend Nainital Taxi!',
   TRUE, TRUE, TRUE),

  ('Priya Mehta', 'Mumbai', 5, 'Perfect for family!',
   'Booked Innova Crysta for our family. Spacious, comfortable, luxurious!',
   TRUE, TRUE, TRUE),

  ('Amit Patel', 'Bangalore', 5, 'Best taxi service!',
   'Professional service with transparent pricing. No hidden charges!',
   TRUE, TRUE, TRUE);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Setup Complete!' as message;
SELECT 'Vehicles: ' || COUNT(*) as info FROM vehicles;
SELECT 'Packages: ' || COUNT(*) as info FROM packages;
SELECT 'Season Periods: ' || COUNT(*) as info FROM seasons;
SELECT 'Pricing Entries: ' || COUNT(*) as info FROM pricing;
SELECT 'Blackout Periods: ' || COUNT(*) as info FROM booking_blackout;

-- Show pricing summary
SELECT
  p.title as package,
  pr.vehicle_type,
  pr.season_name as season,
  '₹' || pr.price as price
FROM pricing pr
JOIN packages p ON pr.package_id = p.id
ORDER BY p.display_order, pr.season_name DESC, pr.vehicle_type;

-- Show season periods
SELECT
  name,
  start_date,
  end_date,
  priority,
  description
FROM seasons
ORDER BY priority DESC, start_date;

-- ============================================================================
-- HELPER QUERIES FOR TESTING
-- ============================================================================

/*
-- Test: Get season for a specific date
SELECT get_season_for_date('2025-05-20');  -- Should return 'Season'
SELECT get_season_for_date('2025-02-15');  -- Should return 'Off-Season'
SELECT get_season_for_date('2025-01-26');  -- Should return 'Season' (Republic Day)

-- Test: Check if booking is allowed
SELECT is_booking_allowed('2025-01-25');   -- Should return TRUE (if blackout is inactive)
SELECT is_booking_allowed('2025-05-15');   -- Should return TRUE

-- Test: Get blackout message
SELECT get_blackout_message('2025-01-25');  -- Returns message if active

-- Enable/Disable blackout periods
UPDATE booking_blackout SET is_active = TRUE WHERE start_date = '2025-01-20';
UPDATE booking_blackout SET is_active = FALSE WHERE start_date = '2025-01-20';

-- Add new long weekend peak pricing
INSERT INTO seasons (name, description, start_date, end_date, priority, is_active)
VALUES ('Season', 'Independence Day weekend', '2025-08-15', '2025-08-17', 20, TRUE);

-- Add new blackout period
INSERT INTO booking_blackout (start_date, end_date, reason, show_message, is_active)
VALUES ('2025-08-15', '2025-08-17', 'Independence Day rush',
        'High demand period. Call +918445206116 for bookings.', TRUE);
*/

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
