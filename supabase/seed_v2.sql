-- ============================================================================
-- NAINITAL TAXI - SEED DATA V2
-- ============================================================================
-- Updated seed data with new vehicle categories and manual pricing
-- ============================================================================

-- ============================================================================
-- VEHICLES (New Categories)
-- ============================================================================

INSERT INTO vehicles (
  name, nickname, registration_number, vehicle_type, status,
  model_name, capacity, luggage_capacity, has_ac, has_music_system, has_child_seat,
  primary_color, color_hex, emoji, personality_trait, tagline,
  featured_image_url, is_featured, is_active, display_order
) VALUES
  -- SEDAN (Dzire, Amaze, Xcent)
  (
    'Sunshine Dzire 🌞',
    'Sunny',
    'UK07AB1234',
    'sedan',
    'available',
    'Maruti Dzire', 4, 2, TRUE, TRUE, FALSE,
    'Sunshine Yellow', '#FFD93D', '🚕',
    'Cheerful & Economical',
    'Your budget-friendly adventure partner!',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
    TRUE, TRUE, 1
  ),
  (
    'Teal Amaze ⚡',
    'Thunder',
    'UK07CD5678',
    'sedan',
    'available',
    'Honda Amaze', 4, 2, TRUE, TRUE, FALSE,
    'Pop Teal', '#4D96FF', '🚗',
    'Swift & Reliable',
    'Mountains await!',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
    TRUE, TRUE, 2
  ),
  (
    'Coral Xcent 🌸',
    'Coral',
    'UK07EF9012',
    'sedan',
    'available',
    'Hyundai Xcent', 4, 2, TRUE, TRUE, FALSE,
    'Pop Coral', '#FF6B6B', '🚙',
    'Cozy & Comfortable',
    'Ride in style!',
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
    FALSE, TRUE, 3
  ),

  -- SUV NORMAL (Ertiga, Triber, Xylo, Tavera)
  (
    'Family Ertiga 👨‍👩‍👧‍👦',
    'Family',
    'UK07GH3456',
    'suv_normal',
    'available',
    'Maruti Ertiga', 7, 3, TRUE, TRUE, TRUE,
    'Pearl White', '#F8F9FA', '🚙',
    'Family-Friendly & Spacious',
    'Perfect for your family adventure!',
    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800',
    TRUE, TRUE, 4
  ),
  (
    'Adventure Triber 🏔️',
    'Adventurer',
    'UK07IJ7890',
    'suv_normal',
    'available',
    'Renault Triber', 7, 3, TRUE, TRUE, TRUE,
    'Mountain Blue', '#4A90E2', '🚐',
    'Versatile & Modern',
    'Explore with flexibility!',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800',
    FALSE, TRUE, 5
  ),
  (
    'Classic Tavera 🎯',
    'Classic',
    'UK07KL1234',
    'suv_normal',
    'available',
    'Chevrolet Tavera', 9, 4, TRUE, TRUE, FALSE,
    'Silver Gray', '#C0C0C0', '🚐',
    'Sturdy & Reliable',
    'Built for the mountains!',
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
    FALSE, TRUE, 6
  ),

  -- SUV DELUXE (Innova, Mazaroo)
  (
    'Premium Innova ⭐',
    'Premium',
    'UK07MN5678',
    'suv_deluxe',
    'available',
    'Toyota Innova', 7, 4, TRUE, TRUE, TRUE,
    'Champagne Gold', '#D4A574', '🚙',
    'Comfortable & Premium',
    'Luxury on wheels!',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
    TRUE, TRUE, 7
  ),
  (
    'Deluxe Marazzo 💎',
    'Deluxe',
    'UK07OP9012',
    'suv_deluxe',
    'available',
    'Mahindra Marazzo', 8, 4, TRUE, TRUE, TRUE,
    'Royal Blue', '#1E3A8A', '🚐',
    'Spacious & Elegant',
    'Your premium mountain ride!',
    'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800',
    FALSE, TRUE, 8
  ),

  -- SUV LUXURY (Innova Crysta)
  (
    'Crysta Royale 👑',
    'Royale',
    'UK07QR3456',
    'suv_luxury',
    'available',
    'Toyota Innova Crysta', 7, 4, TRUE, TRUE, TRUE,
    'Pearl White', '#FFFFFF', '🚘',
    'Luxurious & Sophisticated',
    'Travel like royalty!',
    'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800',
    TRUE, TRUE, 9
  ),
  (
    'Himalayan Crysta Elite 🏔️',
    'Elite',
    'UK07ST7890',
    'suv_luxury',
    'available',
    'Toyota Innova Crysta', 7, 4, TRUE, TRUE, TRUE,
    'Jet Black', '#000000', '🚙',
    'Elite & Powerful',
    'Ultimate comfort in the hills!',
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
    TRUE, TRUE, 10
  );

-- ============================================================================
-- DESTINATIONS
-- ============================================================================

INSERT INTO destinations (
  slug, name, tagline, description, highlights,
  best_time_to_visit, duration, distance_from_nainital,
  hero_image_url, emoji, is_popular, is_active, display_order
) VALUES
  (
    'bhimtal',
    'Bhimtal',
    'Serenity by the Lake',
    'A picturesque lake town with a peaceful island temple. Perfect for boating, photography, and soaking in the tranquil Himalayan vibes.',
    ARRAY['Island Temple Visit', 'Boating & Water Activities', 'Butterfly Research Centre', 'Victoria Dam', 'Folk Culture Museum'],
    'March to June, September to November',
    'Half Day (4-5 hours)',
    22,
    'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200',
    '🏞️', TRUE, TRUE, 1
  ),
  (
    'naukuchiatal',
    'Naukuchiatal',
    'The Nine-Cornered Wonder',
    'A mystical lake with nine corners, surrounded by hills. Legend says spotting all nine corners brings good luck!',
    ARRAY['Nine-Cornered Lake', 'Bird Watching Paradise', 'Paragliding Launch Point', 'Peaceful Surroundings', 'Hanging Bridge'],
    'Year Round',
    'Half Day (3-4 hours)',
    26,
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
    '🌅', FALSE, TRUE, 2
  ),
  (
    'kainchi-dham',
    'Kainchi Dham',
    'Spiritual Serenity',
    'Famous ashram of Neem Karoli Baba. A place of peace, spirituality, and beautiful mountain views.',
    ARRAY['Neem Karoli Baba Ashram', 'Temple Complex', 'Meditation Spots', 'Scenic Mountain Views', 'Sacred River'],
    'Year Round (Avoid Monsoons)',
    'Half Day (3-4 hours)',
    17,
    'https://images.unsplash.com/photo-1590935217281-8f102120d683?w=1200',
    '🕉️', TRUE, TRUE, 3
  ),
  (
    'ranikhet',
    'Ranikhet',
    'Queen of Meadows',
    'A charming hill station with panoramic Himalayan views, golf course, and pine forests.',
    ARRAY['Golf Course', 'Jhula Devi Temple', 'Chaubatia Gardens', 'Himalayan Views', 'Army Museum'],
    'March to June, September to November',
    'Full Day (8-10 hours)',
    60,
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
    '🏔️', TRUE, TRUE, 4
  ),
  (
    'mukteshwar',
    'Mukteshwar',
    'Adventure Awaits',
    'An adventure hub with rock climbing, rappelling, and breathtaking valley views.',
    ARRAY['Adventure Activities', 'Mukteshwar Temple', 'Rock Climbing', 'Chauli Ki Jali', 'Panoramic Views'],
    'Year Round',
    'Full Day (7-8 hours)',
    51,
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200',
    '🌄', FALSE, TRUE, 5
  ),
  (
    'sat-tal',
    'Sat Tal',
    'Seven Lakes Paradise',
    'A cluster of seven interconnected freshwater lakes. A hidden gem for nature lovers.',
    ARRAY['Seven Interconnected Lakes', 'Bird Watching', 'Oak & Pine Forests', 'Camping Sites', 'Nature Trails'],
    'October to June',
    'Half Day (4-5 hours)',
    22,
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200',
    '🦜', FALSE, TRUE, 6
  );

-- ============================================================================
-- PACKAGES (WITHOUT pricing - just metadata)
-- ============================================================================

INSERT INTO packages (
  slug, title, type, duration, distance, places_covered, description,
  includes, excludes, destination_ids, image_url, is_popular, is_seasonal,
  availability_status, min_passengers, max_passengers, suitable_for,
  is_active, display_order
) VALUES
  -- City Tours
  (
    'nainital-darshan',
    'Nainital Local Sightseeing',
    'tour',
    '8-10 hours', 40,
    ARRAY['Naini Lake', 'Mall Road', 'Snow View Point', 'Naina Devi Temple', 'Tiffin Top', 'Cave Garden'],
    'Complete city tour covering all major attractions of Nainital.',
    ARRAY['Experienced Driver', 'Fuel Charges', 'Parking Fees', 'All Hill Station Permits'],
    ARRAY['Entry Fees to Attractions', 'Ropeway/Cable Car Charges', 'Food & Beverages'],
    NULL,
    'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
    TRUE, FALSE, 'available',
    1, 12, ARRAY['families', 'couples', 'solo', 'groups'],
    TRUE, 1
  ),
  (
    'bhimtal-lake-tour',
    'Bhimtal Lake Escape',
    'tour',
    '5-6 hours', 44,
    ARRAY['Bhimtal Lake', 'Island Temple', 'Boating', 'Victoria Dam', 'Butterfly Museum'],
    'Peaceful lake tour with boating and island temple visit.',
    ARRAY['Experienced Driver', 'Fuel Charges', 'Parking Fees'],
    ARRAY['Boating Charges', 'Entry Fees', 'Food & Beverages'],
    (SELECT ARRAY[id] FROM destinations WHERE slug = 'bhimtal'),
    'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
    TRUE, FALSE, 'available',
    1, 12, ARRAY['families', 'couples', 'solo'],
    TRUE, 2
  ),
  (
    'kainchi-dham-darshan',
    'Kainchi Dham Spiritual Journey',
    'tour',
    '4-5 hours', 34,
    ARRAY['Kainchi Dham Ashram', 'Temple Complex', 'Meditation Spots', 'Riverside Views'],
    'Spiritual journey to the famous Neem Karoli Baba Ashram.',
    ARRAY['Experienced Driver', 'Fuel Charges', 'Parking Fees'],
    ARRAY['Donation (Optional)', 'Food & Beverages'],
    (SELECT ARRAY[id] FROM destinations WHERE slug = 'kainchi-dham'),
    'https://images.unsplash.com/photo-1590935217281-8f102120d683?w=800',
    TRUE, FALSE, 'available',
    1, 12, ARRAY['families', 'solo', 'spiritual'],
    TRUE, 3
  ),

  -- Transfers
  (
    'pantnagar-airport-transfer',
    'Pantnagar Airport ✈️ Nainital',
    'transfer',
    '2 hours', 65,
    ARRAY['Pantnagar Airport', 'Nainital'],
    'Direct, hassle-free transfer from Pantnagar Airport to Nainital.',
    ARRAY['Meet & Greet', 'Experienced Driver', 'Fuel Charges', 'Parking & Tolls'],
    ARRAY['Airport Parking (if waiting)'],
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
    TRUE, FALSE, 'available',
    1, 12, ARRAY['families', 'couples', 'solo', 'business'],
    TRUE, 10
  ),
  (
    'kathgodam-station-transfer',
    'Kathgodam Station 🚂 Nainital',
    'transfer',
    '1.5 hours', 35,
    ARRAY['Kathgodam Railway Station', 'Nainital'],
    'Quick and comfortable transfer from Kathgodam Railway Station.',
    ARRAY['Station Pickup', 'Experienced Driver', 'Fuel Charges'],
    ARRAY['Railway Station Parking (if waiting)'],
    'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800',
    TRUE, FALSE, 'available',
    1, 12, ARRAY['families', 'couples', 'solo', 'business'],
    TRUE, 11
  );

-- ============================================================================
-- SEASONS (Peak Pricing Periods)
-- ============================================================================

INSERT INTO seasons (
  name, description, start_date, end_date, is_recurring, recurrence_pattern, is_active
) VALUES
  (
    'Regular Season',
    'Normal pricing throughout the year (default)',
    '2025-01-01', '2025-12-31',
    TRUE, 'Year Round', TRUE
  ),
  (
    'Summer Peak',
    'High season during summer vacations',
    '2025-04-15', '2025-06-30',
    TRUE, 'Annual (April-June)', TRUE
  ),
  (
    'Diwali Weekend',
    'Diwali festival period',
    '2025-10-20', '2025-11-05',
    TRUE, 'Annual (Diwali)', TRUE
  ),
  (
    'Winter Peak',
    'Christmas and New Year period',
    '2025-12-20', '2026-01-05',
    TRUE, 'Annual (Dec-Jan)', TRUE
  );

-- ============================================================================
-- PRICING (Manual Entry - YOU WILL FILL THESE)
-- ============================================================================
-- NOTE: These are EXAMPLE prices - you need to provide actual prices
-- Season ID NULL = Regular season pricing
-- ============================================================================

-- Get season IDs for reference
DO $$
DECLARE
  regular_season_id UUID;
  summer_season_id UUID;
  diwali_season_id UUID;
  winter_season_id UUID;

  nainital_darshan_id UUID;
  bhimtal_tour_id UUID;
  kainchi_dham_id UUID;
  pantnagar_transfer_id UUID;
  kathgodam_transfer_id UUID;
BEGIN
  -- Get season IDs
  SELECT id INTO regular_season_id FROM seasons WHERE name = 'Regular Season';
  SELECT id INTO summer_season_id FROM seasons WHERE name = 'Summer Peak';
  SELECT id INTO diwali_season_id FROM seasons WHERE name = 'Diwali Weekend';
  SELECT id INTO winter_season_id FROM seasons WHERE name = 'Winter Peak';

  -- Get package IDs
  SELECT id INTO nainital_darshan_id FROM packages WHERE slug = 'nainital-darshan';
  SELECT id INTO bhimtal_tour_id FROM packages WHERE slug = 'bhimtal-lake-tour';
  SELECT id INTO kainchi_dham_id FROM packages WHERE slug = 'kainchi-dham-darshan';
  SELECT id INTO pantnagar_transfer_id FROM packages WHERE slug = 'pantnagar-airport-transfer';
  SELECT id INTO kathgodam_transfer_id FROM packages WHERE slug = 'kathgodam-station-transfer';

  -- ==========================
  -- NAINITAL DARSHAN PRICING
  -- ==========================

  -- Regular Season
  INSERT INTO pricing (package_id, vehicle_type, season_id, price, notes) VALUES
    (nainital_darshan_id, 'sedan', regular_season_id, 2000, 'Base price for sedan'),
    (nainital_darshan_id, 'suv_normal', regular_season_id, 2500, 'Base price for normal SUV'),
    (nainital_darshan_id, 'suv_deluxe', regular_season_id, 3500, 'Base price for deluxe SUV'),
    (nainital_darshan_id, 'suv_luxury', regular_season_id, 4500, 'Base price for Crysta');

  -- Summer Peak
  INSERT INTO pricing (package_id, vehicle_type, season_id, price, notes) VALUES
    (nainital_darshan_id, 'sedan', summer_season_id, 2600, 'Summer peak sedan'),
    (nainital_darshan_id, 'suv_normal', summer_season_id, 3200, 'Summer peak normal SUV'),
    (nainital_darshan_id, 'suv_deluxe', summer_season_id, 4500, 'Summer peak deluxe SUV'),
    (nainital_darshan_id, 'suv_luxury', summer_season_id, 5800, 'Summer peak Crysta');

  -- Diwali Weekend
  INSERT INTO pricing (package_id, vehicle_type, season_id, price, notes) VALUES
    (nainital_darshan_id, 'sedan', diwali_season_id, 2800, 'Diwali sedan'),
    (nainital_darshan_id, 'suv_normal', diwali_season_id, 3500, 'Diwali normal SUV'),
    (nainital_darshan_id, 'suv_deluxe', diwali_season_id, 4900, 'Diwali deluxe SUV'),
    (nainital_darshan_id, 'suv_luxury', diwali_season_id, 6300, 'Diwali Crysta');

  -- Winter Peak
  INSERT INTO pricing (package_id, vehicle_type, season_id, price, notes) VALUES
    (nainital_darshan_id, 'sedan', winter_season_id, 3000, 'Winter peak sedan'),
    (nainital_darshan_id, 'suv_normal', winter_season_id, 3750, 'Winter peak normal SUV'),
    (nainital_darshan_id, 'suv_deluxe', winter_season_id, 5250, 'Winter peak deluxe SUV'),
    (nainital_darshan_id, 'suv_luxury', winter_season_id, 6750, 'Winter peak Crysta');

  -- ==========================
  -- BHIMTAL TOUR PRICING
  -- ==========================

  INSERT INTO pricing (package_id, vehicle_type, season_id, price, notes) VALUES
    -- Regular
    (bhimtal_tour_id, 'sedan', regular_season_id, 1800, 'Bhimtal sedan base'),
    (bhimtal_tour_id, 'suv_normal', regular_season_id, 2200, 'Bhimtal normal SUV base'),
    (bhimtal_tour_id, 'suv_deluxe', regular_season_id, 3200, 'Bhimtal deluxe SUV base'),
    (bhimtal_tour_id, 'suv_luxury', regular_season_id, 4000, 'Bhimtal Crysta base'),
    -- Summer
    (bhimtal_tour_id, 'sedan', summer_season_id, 2300, 'Bhimtal sedan summer'),
    (bhimtal_tour_id, 'suv_normal', summer_season_id, 2800, 'Bhimtal normal SUV summer'),
    (bhimtal_tour_id, 'suv_deluxe', summer_season_id, 4000, 'Bhimtal deluxe SUV summer'),
    (bhimtal_tour_id, 'suv_luxury', summer_season_id, 5200, 'Bhimtal Crysta summer');

  -- ==========================
  -- KAINCHI DHAM PRICING
  -- ==========================

  INSERT INTO pricing (package_id, vehicle_type, season_id, price, notes) VALUES
    -- Regular
    (kainchi_dham_id, 'sedan', regular_season_id, 1500, 'Kainchi sedan base'),
    (kainchi_dham_id, 'suv_normal', regular_season_id, 1900, 'Kainchi normal SUV base'),
    (kainchi_dham_id, 'suv_deluxe', regular_season_id, 2700, 'Kainchi deluxe SUV base'),
    (kainchi_dham_id, 'suv_luxury', regular_season_id, 3500, 'Kainchi Crysta base');

  -- ==========================
  -- PANTNAGAR AIRPORT TRANSFER
  -- ==========================

  INSERT INTO pricing (package_id, vehicle_type, season_id, price, notes) VALUES
    -- Regular
    (pantnagar_transfer_id, 'sedan', regular_season_id, 2500, 'Pantnagar sedan base'),
    (pantnagar_transfer_id, 'suv_normal', regular_season_id, 3000, 'Pantnagar normal SUV base'),
    (pantnagar_transfer_id, 'suv_deluxe', regular_season_id, 4000, 'Pantnagar deluxe SUV base'),
    (pantnagar_transfer_id, 'suv_luxury', regular_season_id, 5000, 'Pantnagar Crysta base'),
    -- Summer
    (pantnagar_transfer_id, 'sedan', summer_season_id, 3000, 'Pantnagar sedan summer'),
    (pantnagar_transfer_id, 'suv_normal', summer_season_id, 3600, 'Pantnagar normal SUV summer'),
    (pantnagar_transfer_id, 'suv_deluxe', summer_season_id, 4800, 'Pantnagar deluxe SUV summer'),
    (pantnagar_transfer_id, 'suv_luxury', summer_season_id, 6000, 'Pantnagar Crysta summer');

  -- ==========================
  -- KATHGODAM STATION TRANSFER
  -- ==========================

  INSERT INTO pricing (package_id, vehicle_type, season_id, price, notes) VALUES
    -- Regular
    (kathgodam_transfer_id, 'sedan', regular_season_id, 1200, 'Kathgodam sedan base'),
    (kathgodam_transfer_id, 'suv_normal', regular_season_id, 1500, 'Kathgodam normal SUV base'),
    (kathgodam_transfer_id, 'suv_deluxe', regular_season_id, 2000, 'Kathgodam deluxe SUV base'),
    (kathgodam_transfer_id, 'suv_luxury', regular_season_id, 2500, 'Kathgodam Crysta base'),
    -- Summer
    (kathgodam_transfer_id, 'sedan', summer_season_id, 1500, 'Kathgodam sedan summer'),
    (kathgodam_transfer_id, 'suv_normal', summer_season_id, 1900, 'Kathgodam normal SUV summer'),
    (kathgodam_transfer_id, 'suv_deluxe', summer_season_id, 2500, 'Kathgodam deluxe SUV summer'),
    (kathgodam_transfer_id, 'suv_luxury', summer_season_id, 3200, 'Kathgodam Crysta summer');

END $$;

-- ============================================================================
-- AVAILABILITY (Next 90 Days)
-- ============================================================================

INSERT INTO availability (date, total_fleet_size, cars_booked, is_blocked, internal_notes)
SELECT
  (CURRENT_DATE + i)::date as date,
  10 as total_fleet_size,
  0 as cars_booked,
  FALSE as is_blocked,
  NULL as internal_notes
FROM generate_series(0, 90) as i;

-- Sample bookings
UPDATE availability SET cars_booked = 3 WHERE date = CURRENT_DATE + INTERVAL '5 days';
UPDATE availability SET cars_booked = 7 WHERE date = CURRENT_DATE + INTERVAL '7 days';

-- ============================================================================
-- REVIEWS
-- ============================================================================

INSERT INTO reviews (
  customer_name, customer_location, rating, title, review_text,
  is_verified, is_featured, is_approved
) VALUES
  (
    'Rahul Sharma',
    'Delhi',
    5,
    'Amazing service and punctual!',
    'The driver was right on time, the car was spotless. Highly recommend Nainital Taxi!',
    TRUE, TRUE, TRUE
  ),
  (
    'Priya Mehta',
    'Mumbai',
    5,
    'Perfect for family trip!',
    'We booked the Innova Crysta for our family. Spacious, comfortable, and luxurious!',
    TRUE, TRUE, TRUE
  ),
  (
    'Amit Patel',
    'Bangalore',
    5,
    'Best taxi service!',
    'Professional service with transparent pricing. No hidden charges!',
    TRUE, TRUE, TRUE
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Vehicles: ' || COUNT(*) FROM vehicles;
SELECT 'Destinations: ' || COUNT(*) FROM destinations;
SELECT 'Packages: ' || COUNT(*) FROM packages;
SELECT 'Seasons: ' || COUNT(*) FROM seasons;
SELECT 'Pricing Entries: ' || COUNT(*) FROM pricing;
SELECT 'Availability Days: ' || COUNT(*) FROM availability;
SELECT 'Reviews: ' || COUNT(*) FROM reviews;

-- Show pricing summary
SELECT
  p.title as package,
  pr.vehicle_type,
  s.name as season,
  pr.price
FROM pricing pr
JOIN packages p ON pr.package_id = p.id
JOIN seasons s ON pr.season_id = s.id
ORDER BY p.title, s.name, pr.vehicle_type;

-- ============================================================================
-- END OF SEED DATA V2
-- ============================================================================
