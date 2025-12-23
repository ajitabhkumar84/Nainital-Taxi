-- ============================================================================
-- NAINITAL TAXI - SEED DATA (FINAL - SIMPLIFIED)
-- ============================================================================
-- 2 Seasons: Off-Season and Season
-- YOU control the dates and can change them anytime
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
   'https://images.unsplash.com/photo-1590935217281-8f102120d683?w=1200', '🕉️', TRUE, TRUE, 3);

-- ============================================================================
-- PACKAGES
-- ============================================================================

INSERT INTO packages (
  slug, title, type, duration, distance, places_covered, description, includes, excludes,
  destination_ids, image_url, is_popular, is_seasonal, availability_status,
  min_passengers, suitable_for, is_active, display_order
) VALUES
  ('nainital-darshan', 'Nainital Local Sightseeing', 'tour',
   '8-10 hours', 40,
   ARRAY['Naini Lake', 'Mall Road', 'Snow View Point', 'Naina Devi Temple', 'Tiffin Top', 'Cave Garden'],
   'Complete city tour covering all major attractions of Nainital.',
   ARRAY['Experienced Driver', 'Fuel Charges', 'Parking Fees', 'Hill Permits'],
   ARRAY['Entry Fees', 'Ropeway Charges', 'Food & Beverages'],
   NULL, 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
   TRUE, FALSE, 'available', 1, ARRAY['families', 'couples', 'solo', 'groups'], TRUE, 1),

  ('bhimtal-lake-tour', 'Bhimtal Lake Escape', 'tour',
   '5-6 hours', 44,
   ARRAY['Bhimtal Lake', 'Island Temple', 'Boating', 'Victoria Dam', 'Butterfly Museum'],
   'Peaceful lake tour with boating and island temple visit.',
   ARRAY['Experienced Driver', 'Fuel Charges', 'Parking Fees'],
   ARRAY['Boating Charges', 'Entry Fees', 'Food'],
   (SELECT ARRAY[id] FROM destinations WHERE slug = 'bhimtal'),
   'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
   TRUE, FALSE, 'available', 1, ARRAY['families', 'couples', 'solo'], TRUE, 2),

  ('kainchi-dham-darshan', 'Kainchi Dham Spiritual Journey', 'tour',
   '4-5 hours', 34,
   ARRAY['Kainchi Dham Ashram', 'Temple Complex', 'Meditation Spots', 'Riverside Views'],
   'Spiritual journey to the famous Neem Karoli Baba Ashram.',
   ARRAY['Experienced Driver', 'Fuel Charges', 'Parking Fees'],
   ARRAY['Donation (Optional)', 'Food & Beverages'],
   (SELECT ARRAY[id] FROM destinations WHERE slug = 'kainchi-dham'),
   'https://images.unsplash.com/photo-1590935217281-8f102120d683?w=800',
   TRUE, FALSE, 'available', 1, ARRAY['families', 'solo', 'spiritual'], TRUE, 3),

  ('pantnagar-airport-transfer', 'Pantnagar Airport ✈️ Nainital', 'transfer',
   '2 hours', 65,
   ARRAY['Pantnagar Airport', 'Nainital'],
   'Direct transfer from Pantnagar Airport to Nainital with meet & greet.',
   ARRAY['Meet & Greet', 'Experienced Driver', 'Fuel Charges', 'Tolls'],
   ARRAY['Airport Parking (if waiting)'],
   NULL, 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
   TRUE, FALSE, 'available', 1, ARRAY['families', 'couples', 'solo', 'business'], TRUE, 10),

  ('kathgodam-station-transfer', 'Kathgodam Station 🚂 Nainital', 'transfer',
   '1.5 hours', 35,
   ARRAY['Kathgodam Railway Station', 'Nainital'],
   'Quick transfer from Kathgodam Railway Station to Nainital.',
   ARRAY['Station Pickup', 'Experienced Driver', 'Fuel Charges'],
   ARRAY['Station Parking (if waiting)'],
   NULL, 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800',
   TRUE, FALSE, 'available', 1, ARRAY['families', 'couples', 'solo'], TRUE, 11);

-- ============================================================================
-- SEASONS (ONLY 2 - YOU CONTROL THE DATES)
-- ============================================================================

INSERT INTO seasons (name, description, start_date, end_date, is_recurring, is_active) VALUES
  (
    'Off-Season',
    'Regular pricing - year-round default',
    '2025-01-01',
    '2025-12-31',
    TRUE,
    TRUE
  ),
  (
    'Season',
    'Peak season pricing - YOU can change these dates anytime',
    '2025-04-15',  -- START: You can change this date
    '2025-06-30',  -- END: You can change this date
    TRUE,
    TRUE
  );

COMMENT ON TABLE seasons IS 'To change season dates: UPDATE seasons SET start_date = ''2025-05-01'', end_date = ''2025-07-15'' WHERE name = ''Season'';';

-- ============================================================================
-- PRICING (PLACEHOLDER - YOU MUST UPDATE THESE)
-- ============================================================================
-- Each package needs 8 prices total:
-- 4 vehicle types × 2 seasons = 8 prices per package
-- ============================================================================

DO $$
DECLARE
  off_season_id UUID;
  season_id UUID;

  nainital_id UUID;
  bhimtal_id UUID;
  kainchi_id UUID;
  pantnagar_id UUID;
  kathgodam_id UUID;
BEGIN
  -- Get season IDs
  SELECT id INTO off_season_id FROM seasons WHERE name = 'Off-Season';
  SELECT id INTO season_id FROM seasons WHERE name = 'Season';

  -- Get package IDs
  SELECT id INTO nainital_id FROM packages WHERE slug = 'nainital-darshan';
  SELECT id INTO bhimtal_id FROM packages WHERE slug = 'bhimtal-lake-tour';
  SELECT id INTO kainchi_id FROM packages WHERE slug = 'kainchi-dham-darshan';
  SELECT id INTO pantnagar_id FROM packages WHERE slug = 'pantnagar-airport-transfer';
  SELECT id INTO kathgodam_id FROM packages WHERE slug = 'kathgodam-station-transfer';

  -- ======================================
  -- NAINITAL DARSHAN PRICING
  -- ======================================

  INSERT INTO pricing (package_id, vehicle_type, season_id, price, notes) VALUES
    -- OFF-SEASON (CHANGE THESE PRICES)
    (nainital_id, 'sedan', off_season_id, 2000, 'Sedan off-season'),
    (nainital_id, 'suv_normal', off_season_id, 2500, 'SUV Normal off-season'),
    (nainital_id, 'suv_deluxe', off_season_id, 3500, 'SUV Deluxe off-season'),
    (nainital_id, 'suv_luxury', off_season_id, 4500, 'Crysta off-season'),

    -- SEASON / PEAK (CHANGE THESE PRICES)
    (nainital_id, 'sedan', season_id, 2600, 'Sedan peak season'),
    (nainital_id, 'suv_normal', season_id, 3200, 'SUV Normal peak'),
    (nainital_id, 'suv_deluxe', season_id, 4500, 'SUV Deluxe peak'),
    (nainital_id, 'suv_luxury', season_id, 5800, 'Crysta peak');

  -- ======================================
  -- BHIMTAL TOUR PRICING
  -- ======================================

  INSERT INTO pricing (package_id, vehicle_type, season_id, price, notes) VALUES
    -- OFF-SEASON
    (bhimtal_id, 'sedan', off_season_id, 1800, 'Sedan off-season'),
    (bhimtal_id, 'suv_normal', off_season_id, 2200, 'SUV Normal off-season'),
    (bhimtal_id, 'suv_deluxe', off_season_id, 3200, 'SUV Deluxe off-season'),
    (bhimtal_id, 'suv_luxury', off_season_id, 4000, 'Crysta off-season'),

    -- SEASON
    (bhimtal_id, 'sedan', season_id, 2300, 'Sedan peak'),
    (bhimtal_id, 'suv_normal', season_id, 2800, 'SUV Normal peak'),
    (bhimtal_id, 'suv_deluxe', season_id, 4000, 'SUV Deluxe peak'),
    (bhimtal_id, 'suv_luxury', season_id, 5200, 'Crysta peak');

  -- ======================================
  -- KAINCHI DHAM PRICING
  -- ======================================

  INSERT INTO pricing (package_id, vehicle_type, season_id, price, notes) VALUES
    -- OFF-SEASON
    (kainchi_id, 'sedan', off_season_id, 1500, 'Sedan off-season'),
    (kainchi_id, 'suv_normal', off_season_id, 1900, 'SUV Normal off-season'),
    (kainchi_id, 'suv_deluxe', off_season_id, 2700, 'SUV Deluxe off-season'),
    (kainchi_id, 'suv_luxury', off_season_id, 3500, 'Crysta off-season'),

    -- SEASON
    (kainchi_id, 'sedan', season_id, 1900, 'Sedan peak'),
    (kainchi_id, 'suv_normal', season_id, 2400, 'SUV Normal peak'),
    (kainchi_id, 'suv_deluxe', season_id, 3400, 'SUV Deluxe peak'),
    (kainchi_id, 'suv_luxury', season_id, 4500, 'Crysta peak');

  -- ======================================
  -- PANTNAGAR AIRPORT TRANSFER
  -- ======================================

  INSERT INTO pricing (package_id, vehicle_type, season_id, price, notes) VALUES
    -- OFF-SEASON
    (pantnagar_id, 'sedan', off_season_id, 2500, 'Sedan off-season'),
    (pantnagar_id, 'suv_normal', off_season_id, 3000, 'SUV Normal off-season'),
    (pantnagar_id, 'suv_deluxe', off_season_id, 4000, 'SUV Deluxe off-season'),
    (pantnagar_id, 'suv_luxury', off_season_id, 5000, 'Crysta off-season'),

    -- SEASON
    (pantnagar_id, 'sedan', season_id, 3000, 'Sedan peak'),
    (pantnagar_id, 'suv_normal', season_id, 3600, 'SUV Normal peak'),
    (pantnagar_id, 'suv_deluxe', season_id, 4800, 'SUV Deluxe peak'),
    (pantnagar_id, 'suv_luxury', season_id, 6000, 'Crysta peak');

  -- ======================================
  -- KATHGODAM STATION TRANSFER
  -- ======================================

  INSERT INTO pricing (package_id, vehicle_type, season_id, price, notes) VALUES
    -- OFF-SEASON
    (kathgodam_id, 'sedan', off_season_id, 1200, 'Sedan off-season'),
    (kathgodam_id, 'suv_normal', off_season_id, 1500, 'SUV Normal off-season'),
    (kathgodam_id, 'suv_deluxe', off_season_id, 2000, 'SUV Deluxe off-season'),
    (kathgodam_id, 'suv_luxury', off_season_id, 2500, 'Crysta off-season'),

    -- SEASON
    (kathgodam_id, 'sedan', season_id, 1500, 'Sedan peak'),
    (kathgodam_id, 'suv_normal', season_id, 1900, 'SUV Normal peak'),
    (kathgodam_id, 'suv_deluxe', season_id, 2500, 'SUV Deluxe peak'),
    (kathgodam_id, 'suv_luxury', season_id, 3200, 'Crysta peak');

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
SELECT 'Vehicles: ' || COUNT(*) FROM vehicles;
SELECT 'Packages: ' || COUNT(*) FROM packages;
SELECT 'Seasons: ' || COUNT(*) FROM seasons;
SELECT 'Pricing Entries: ' || COUNT(*) FROM pricing;
SELECT 'Total prices per package: ' || COUNT(*)::float / (SELECT COUNT(*) FROM packages) FROM pricing;

-- Show pricing summary
SELECT
  p.title as package,
  pr.vehicle_type,
  s.name as season,
  '₹' || pr.price as price
FROM pricing pr
JOIN packages p ON pr.package_id = p.id
JOIN seasons s ON pr.season_id = s.id
ORDER BY p.display_order, s.name DESC, pr.vehicle_type;

-- ============================================================================
-- INSTRUCTIONS FOR CHANGING SEASON DATES
-- ============================================================================

/*
TO CHANGE SEASON DATES:

UPDATE seasons
SET start_date = '2025-05-01',
    end_date = '2025-08-31'
WHERE name = 'Season';

This will immediately apply to all pricing lookups!
*/

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
