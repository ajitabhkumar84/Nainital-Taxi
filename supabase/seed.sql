-- ============================================================================
-- NAINITAL FUN TAXI - SEED DATA
-- ============================================================================
-- On-brand initial data with "Retro Pop" aesthetic
-- Run this after creating the schema
-- ============================================================================

-- ============================================================================
-- VEHICLES (Fleet with Retro Pop Personality)
-- ============================================================================

INSERT INTO vehicles (
  name, nickname, registration_number, vehicle_type, status,
  capacity, luggage_capacity, has_ac, has_music_system, has_child_seat,
  primary_color, color_hex, emoji, personality_trait, tagline,
  featured_image_url, base_price_multiplier, is_featured, is_active, display_order
) VALUES
  -- Sedans (Compact & Fun)
  (
    'Sunshine Express 🌞',
    'Sunny',
    'UK07AB1234',
    'sedan',
    'available',
    4, 2, TRUE, TRUE, FALSE,
    'Sunshine Yellow', '#FFD93D', '🚕',
    'Cheerful & Energetic',
    'Your vacation wingman!',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
    1.00, TRUE, TRUE, 1
  ),
  (
    'Teal Thunder ⚡',
    'Thunder',
    'UK07CD5678',
    'sedan',
    'available',
    4, 2, TRUE, TRUE, FALSE,
    'Pop Teal', '#4D96FF', '🚗',
    'Swift & Reliable',
    'Mountains await!',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
    1.00, TRUE, TRUE, 2
  ),
  (
    'Coral Cruiser 🌸',
    'Coral',
    'UK07EF9012',
    'sedan',
    'available',
    4, 2, TRUE, TRUE, FALSE,
    'Pop Coral', '#FF6B6B', '🚙',
    'Cozy & Comfortable',
    'Ride in style!',
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
    1.00, FALSE, TRUE, 3
  ),

  -- SUVs (Spacious & Premium)
  (
    'Mountain Maverick 🏔️',
    'Maverick',
    'UK07GH3456',
    'suv',
    'available',
    6, 4, TRUE, TRUE, TRUE,
    'Alpine White', '#F8F9FA', '🚙',
    'Adventurous & Bold',
    'Conquer the hills in comfort!',
    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800',
    1.40, TRUE, TRUE, 4
  ),
  (
    'Valley Voyager 🌄',
    'Voyager',
    'UK07IJ7890',
    'suv',
    'available',
    7, 4, TRUE, TRUE, TRUE,
    'Forest Green', '#2D5016', '🚐',
    'Luxurious & Smooth',
    'Your luxury escape vehicle!',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800',
    1.40, TRUE, TRUE, 5
  ),
  (
    'Sunset Safari 🌅',
    'Safari',
    'UK07KL1234',
    'suv',
    'available',
    7, 4, TRUE, TRUE, TRUE,
    'Desert Beige', '#D4A574', '🚙',
    'Spacious & Family-Friendly',
    'Room for everyone!',
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
    1.40, FALSE, TRUE, 6
  ),

  -- Tempo Travellers (Group Tours)
  (
    'Party Hauler 🎉',
    'Party Bus',
    'UK07MN5678',
    'tempo_traveller',
    'available',
    12, 8, TRUE, TRUE, TRUE,
    'Sunshine Yellow', '#FFD93D', '🚐',
    'Fun & Festive',
    'Squad goals on wheels!',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
    2.20, TRUE, TRUE, 7
  ),
  (
    'Family Express 👨‍👩‍👧‍👦',
    'Family Van',
    'UK07OP9012',
    'tempo_traveller',
    'available',
    14, 10, TRUE, TRUE, TRUE,
    'Sky Blue', '#87CEEB', '🚌',
    'Spacious & Reliable',
    'Perfect for family adventures!',
    'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800',
    2.20, FALSE, TRUE, 8
  ),

  -- Luxury Options
  (
    'Himalayan Royale 👑',
    'Royale',
    'UK07QR3456',
    'luxury',
    'available',
    4, 3, TRUE, TRUE, TRUE,
    'Jet Black', '#000000', '🚘',
    'Elite & Sophisticated',
    'Travel like royalty!',
    'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800',
    1.80, TRUE, TRUE, 9
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
    'A charming hill station with panoramic Himalayan views, golf course, and pine forests. Literally means "Queen''s Meadow".',
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
    'An adventure hub with rock climbing, rappelling, and breathtaking valley views. Perfect for thrill-seekers!',
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
    'A cluster of seven interconnected freshwater lakes. A hidden gem for nature lovers and bird watchers.',
    ARRAY['Seven Interconnected Lakes', 'Bird Watching', 'Oak & Pine Forests', 'Camping Sites', 'Nature Trails'],
    'October to June',
    'Half Day (4-5 hours)',
    22,
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200',
    '🦜', FALSE, TRUE, 6
  );

-- ============================================================================
-- PACKAGES (Tour Packages)
-- ============================================================================

INSERT INTO packages (
  slug, title, type,
  base_price_sedan, suv_multiplier, tempo_multiplier, luxury_multiplier,
  duration, distance, places_covered, description,
  includes, excludes, destination_ids,
  image_url, is_popular, is_seasonal, availability_status,
  min_passengers, max_passengers, suitable_for,
  is_active, display_order
) VALUES
  -- City Tours
  (
    'nainital-darshan',
    'Nainital Local Sightseeing',
    'tour',
    2000, 1.40, 2.20, 1.80,
    '8-10 hours', 40,
    ARRAY['Naini Lake', 'Mall Road', 'Snow View Point', 'Naina Devi Temple', 'Tiffin Top', 'Cave Garden'],
    'Complete city tour covering all major attractions of Nainital. Experience the charm of the "Lake District of India" with our friendly local drivers.',
    ARRAY['Experienced Driver', 'Fuel Charges', 'Parking Fees', 'All Hill Station Permits'],
    ARRAY['Entry Fees to Attractions', 'Ropeway/Cable Car Charges', 'Food & Beverages', 'Personal Expenses'],
    NULL,
    'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
    TRUE, FALSE, 'available',
    1, 12, ARRAY['families', 'couples', 'solo', 'groups'],
    TRUE, 1
  ),

  -- Lake Tours
  (
    'bhimtal-lake-tour',
    'Bhimtal Lake Escape',
    'tour',
    1800, 1.40, 2.20, 1.80,
    '5-6 hours', 44,
    ARRAY['Bhimtal Lake', 'Island Temple', 'Boating', 'Victoria Dam', 'Butterfly Museum'],
    'Peaceful lake tour with boating and island temple visit. Escape the crowds and enjoy nature at its finest.',
    ARRAY['Experienced Driver', 'Fuel Charges', 'Parking Fees'],
    ARRAY['Boating Charges', 'Entry Fees', 'Food & Beverages'],
    (SELECT ARRAY[id] FROM destinations WHERE slug = 'bhimtal'),
    'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
    TRUE, FALSE, 'available',
    1, 12, ARRAY['families', 'couples', 'solo'],
    TRUE, 2
  ),

  (
    'naukuchiatal-tour',
    'Naukuchiatal Mystery Tour',
    'tour',
    1600, 1.40, 2.20, 1.80,
    '4-5 hours', 52,
    ARRAY['Naukuchiatal Lake', 'Paragliding Point', 'Hanging Bridge', 'Bird Watching'],
    'Discover the mystical nine-cornered lake. Perfect for adventure seekers and nature photographers.',
    ARRAY['Experienced Driver', 'Fuel Charges', 'Parking Fees'],
    ARRAY['Paragliding Charges', 'Food & Beverages', 'Personal Expenses'],
    (SELECT ARRAY[id] FROM destinations WHERE slug = 'naukuchiatal'),
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    FALSE, FALSE, 'available',
    1, 12, ARRAY['couples', 'adventure', 'groups'],
    TRUE, 3
  ),

  -- Spiritual Tour
  (
    'kainchi-dham-darshan',
    'Kainchi Dham Spiritual Journey',
    'tour',
    1500, 1.40, 2.20, 1.80,
    '4-5 hours', 34,
    ARRAY['Kainchi Dham Ashram', 'Temple Complex', 'Meditation Spots', 'Riverside Views'],
    'Spiritual journey to the famous Neem Karoli Baba Ashram. Find peace and blessings in this sacred place.',
    ARRAY['Experienced Driver', 'Fuel Charges', 'Parking Fees'],
    ARRAY['Donation (Optional)', 'Food & Beverages'],
    (SELECT ARRAY[id] FROM destinations WHERE slug = 'kainchi-dham'),
    'https://images.unsplash.com/photo-1590935217281-8f102120d683?w=800',
    TRUE, FALSE, 'available',
    1, 12, ARRAY['families', 'solo', 'spiritual'],
    TRUE, 4
  ),

  -- Long Distance Tours
  (
    'ranikhet-day-trip',
    'Ranikhet Himalayan Escape',
    'tour',
    3500, 1.40, 2.20, 1.80,
    '10-12 hours', 120,
    ARRAY['Ranikhet', 'Golf Course', 'Jhula Devi Temple', 'Chaubatia Gardens', 'Mountain Views'],
    'Full day trip to the charming Ranikhet. Enjoy golf, temples, gardens, and stunning Himalayan panoramas.',
    ARRAY['Experienced Driver', 'Fuel Charges', 'Parking Fees', 'Hill Station Permits'],
    ARRAY['Entry Fees', 'Food & Beverages', 'Personal Expenses'],
    (SELECT ARRAY[id] FROM destinations WHERE slug = 'ranikhet'),
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    TRUE, FALSE, 'available',
    1, 12, ARRAY['families', 'couples', 'groups'],
    TRUE, 5
  ),

  (
    'mukteshwar-adventure',
    'Mukteshwar Adventure Day',
    'tour',
    3200, 1.40, 2.20, 1.80,
    '9-10 hours', 102,
    ARRAY['Mukteshwar', 'Mukteshwar Temple', 'Chauli Ki Jali', 'Adventure Activities', 'Sunset Point'],
    'Adventure-packed day trip to Mukteshwar. Rock climbing, rappelling, and breathtaking valley views await!',
    ARRAY['Experienced Driver', 'Fuel Charges', 'Parking Fees'],
    ARRAY['Adventure Activity Charges', 'Entry Fees', 'Food & Beverages'],
    (SELECT ARRAY[id] FROM destinations WHERE slug = 'mukteshwar'),
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800',
    FALSE, FALSE, 'available',
    1, 12, ARRAY['adventure', 'couples', 'groups'],
    TRUE, 6
  );

-- ============================================================================
-- PACKAGES (Transfers)
-- ============================================================================

INSERT INTO packages (
  slug, title, type,
  base_price_sedan, suv_multiplier, tempo_multiplier, luxury_multiplier,
  duration, distance, places_covered, description,
  includes, excludes,
  image_url, is_popular, is_seasonal, availability_status,
  min_passengers, max_passengers, suitable_for,
  is_active, display_order
) VALUES
  -- Airport Transfers
  (
    'pantnagar-airport-transfer',
    'Pantnagar Airport ✈️ Nainital',
    'transfer',
    2500, 1.40, 2.20, 1.80,
    '2 hours', 65,
    ARRAY['Pantnagar Airport', 'Nainital'],
    'Direct, hassle-free transfer from Pantnagar Airport to Nainital. Meet & greet service with nameplate.',
    ARRAY['Meet & Greet', 'Experienced Driver', 'Fuel Charges', 'Parking & Tolls'],
    ARRAY['Airport Parking (if waiting)'],
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
    TRUE, FALSE, 'available',
    1, 12, ARRAY['families', 'couples', 'solo', 'business'],
    TRUE, 10
  ),

  -- Railway Station Transfers
  (
    'kathgodam-station-transfer',
    'Kathgodam Station 🚂 Nainital',
    'transfer',
    1200, 1.40, 2.20, 1.80,
    '1.5 hours', 35,
    ARRAY['Kathgodam Railway Station', 'Nainital'],
    'Quick and comfortable transfer from Kathgodam Railway Station to Nainital. Perfect start to your vacation!',
    ARRAY['Station Pickup', 'Experienced Driver', 'Fuel Charges'],
    ARRAY['Railway Station Parking (if waiting)'],
    'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800',
    TRUE, FALSE, 'available',
    1, 12, ARRAY['families', 'couples', 'solo', 'business'],
    TRUE, 11
  ),

  (
    'haldwani-station-transfer',
    'Haldwani Station 🚂 Nainital',
    'transfer',
    1500, 1.40, 2.20, 1.80,
    '1.5 hours', 40,
    ARRAY['Haldwani Railway Station', 'Nainital'],
    'Comfortable transfer from Haldwani Station to Nainital. Sit back and enjoy the scenic mountain drive.',
    ARRAY['Station Pickup', 'Experienced Driver', 'Fuel Charges'],
    ARRAY['Railway Station Parking (if waiting)'],
    'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800',
    FALSE, FALSE, 'available',
    1, 12, ARRAY['families', 'couples', 'solo'],
    TRUE, 12
  ),

  -- Long Distance Transfers
  (
    'delhi-nainital-transfer',
    'Delhi 🏙️ Nainital One-Way',
    'transfer',
    8500, 1.40, 2.20, 1.80,
    '7-8 hours', 315,
    ARRAY['Delhi (Any Location)', 'Nainital'],
    'Premium long-distance transfer from Delhi to Nainital. Comfortable journey with experienced hill-driving experts.',
    ARRAY['Door-to-Door Pickup', 'Experienced Driver', 'Fuel Charges', 'Tolls & Parking'],
    ARRAY['Food & Refreshments (1 meal stop included)', 'Driver Allowance (₹500)'],
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800',
    TRUE, FALSE, 'available',
    1, 12, ARRAY['families', 'couples', 'groups'],
    TRUE, 13
  ),

  (
    'dehradun-nainital-transfer',
    'Dehradun ✈️ Nainital One-Way',
    'transfer',
    5500, 1.40, 2.20, 1.80,
    '5-6 hours', 220,
    ARRAY['Dehradun (Airport/City)', 'Nainital'],
    'Scenic transfer from Dehradun to Nainital via beautiful Himalayan roads. Perfect for direct connections.',
    ARRAY['Airport/Hotel Pickup', 'Experienced Driver', 'Fuel Charges', 'Tolls'],
    ARRAY['Food & Refreshments', 'Driver Allowance (₹400)'],
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
    FALSE, FALSE, 'available',
    1, 12, ARRAY['families', 'couples', 'business'],
    TRUE, 14
  );

-- ============================================================================
-- SEASONS (Peak Pricing Periods)
-- ============================================================================

INSERT INTO seasons (
  name, description, start_date, end_date, price_multiplier, is_recurring, recurrence_pattern, is_active
) VALUES
  (
    'Summer Peak Season',
    'High season during summer vacations when families visit hill stations',
    '2025-04-15', '2025-06-30',
    1.30, TRUE, 'Annual (April-June)', TRUE
  ),
  (
    'Diwali Rush',
    'Major holiday period with high demand',
    '2025-10-20', '2025-11-05',
    1.40, TRUE, 'Annual (Diwali Period)', TRUE
  ),
  (
    'Christmas & New Year',
    'Peak winter season with Christmas and New Year celebrations',
    '2025-12-20', '2026-01-05',
    1.50, TRUE, 'Annual (Dec-Jan)', TRUE
  ),
  (
    'Long Weekends Premium',
    'Republic Day Weekend',
    '2025-01-24', '2025-01-26',
    1.20, TRUE, 'Long Weekends', TRUE
  ),
  (
    'Holi Weekend',
    'Holi festival period',
    '2025-03-13', '2025-03-16',
    1.25, TRUE, 'Annual (Holi)', TRUE
  );

-- ============================================================================
-- AVAILABILITY (Next 90 Days)
-- ============================================================================

-- Generate availability for the next 90 days with default fleet size of 10
INSERT INTO availability (date, total_fleet_size, cars_booked, is_blocked, internal_notes)
SELECT
  (CURRENT_DATE + i)::date as date,
  10 as total_fleet_size,
  0 as cars_booked,
  FALSE as is_blocked,
  NULL as internal_notes
FROM generate_series(0, 90) as i;

-- Block some sample dates (maintenance day, holidays, etc.)
UPDATE availability
SET is_blocked = TRUE, internal_notes = 'Fleet Maintenance Day'
WHERE date = CURRENT_DATE + INTERVAL '15 days';

UPDATE availability
SET is_blocked = TRUE, internal_notes = 'Owner Family Event'
WHERE date = CURRENT_DATE + INTERVAL '30 days';

-- Add some bookings to show realistic availability
UPDATE availability
SET cars_booked = 3
WHERE date = CURRENT_DATE + INTERVAL '5 days';

UPDATE availability
SET cars_booked = 7
WHERE date = CURRENT_DATE + INTERVAL '7 days';

UPDATE availability
SET cars_booked = 9
WHERE date = CURRENT_DATE + INTERVAL '10 days';

UPDATE availability
SET cars_booked = 10
WHERE date = CURRENT_DATE + INTERVAL '14 days';

-- ============================================================================
-- REVIEWS (Sample Testimonials)
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
    'The driver was right on time, the car was spotless, and he took us to all the best spots in Nainital. The Sunshine Express lived up to its name! Highly recommend Nainital Taxi.',
    TRUE, TRUE, TRUE
  ),
  (
    'Priya Mehta',
    'Mumbai',
    5,
    'Perfect for family trip!',
    'We booked the Mountain Maverick SUV for our family of 6. Spacious, comfortable, and the driver was so friendly with our kids. Made the trip memorable!',
    TRUE, TRUE, TRUE
  ),
  (
    'Amit Patel',
    'Bangalore',
    5,
    'Best taxi service in Nainital',
    'Very professional service with transparent pricing. The booking process was smooth, and no hidden charges. Will definitely use again on our next visit!',
    TRUE, TRUE, TRUE
  ),
  (
    'Sneha Gupta',
    'Pune',
    4,
    'Great experience overall',
    'Loved the retro vibe of the website and the service matched the quality. Driver knew all the local spots and shortcuts. Only slight delay in pickup due to traffic.',
    TRUE, FALSE, TRUE
  ),
  (
    'Vikram Singh',
    'Jaipur',
    5,
    'Spiritual journey made easy',
    'Booked for Kainchi Dham darshan. The driver was respectful and gave us enough time at the ashram. Peaceful and comfortable ride.',
    TRUE, TRUE, TRUE
  ),
  (
    'Anjali Reddy',
    'Hyderabad',
    5,
    'Valley Voyager is luxury!',
    'Splurged on the SUV and it was worth every rupee. Leather seats, great AC, and smooth ride through the hills. Felt like VIPs!',
    TRUE, FALSE, TRUE
  ),
  (
    'Karan Malhotra',
    'Chandigarh',
    5,
    'Party Hauler for our group trip',
    'Took 12 of us to Ranikhet. The tempo was perfect - spacious, fun, and the driver handled the hills like a pro. Made our bachelor party epic!',
    TRUE, TRUE, TRUE
  ),
  (
    'Divya Nair',
    'Kochi',
    4,
    'Good value for money',
    'Kathgodam station pickup was smooth. Car was clean and driver polite. Reached our hotel safely. Good service at reasonable rates.',
    TRUE, FALSE, TRUE
  );

-- ============================================================================
-- ADMIN SETTINGS (Initial Configuration)
-- ============================================================================

-- Update admin settings with initial values
UPDATE admin_settings SET value = '10' WHERE key = 'fleet_size';
UPDATE admin_settings SET value = 'true' WHERE key = 'waitlist_enabled';
UPDATE admin_settings SET value = '24' WHERE key = 'waitlist_expiry_hours';
UPDATE admin_settings SET value = '90' WHERE key = 'booking_advance_days';
UPDATE admin_settings SET value = '24' WHERE key = 'cancellation_hours';

-- ============================================================================
-- SAMPLE BOOKINGS (For Testing)
-- ============================================================================

-- Insert a few sample bookings to test the system
INSERT INTO bookings (
  customer_name, customer_phone, customer_email,
  package_id, package_name, vehicle_type,
  booking_date, pickup_time, pickup_location, passengers,
  base_price, vehicle_multiplier, season_multiplier, final_price,
  payment_status, status, booking_source
)
SELECT
  'Test Customer',
  '+919999999999',
  'test@example.com',
  p.id,
  p.title,
  'sedan',
  CURRENT_DATE + INTERVAL '5 days',
  '09:00:00',
  'Hotel Manu Maharani',
  4,
  p.base_price_sedan,
  1.00,
  1.00,
  p.base_price_sedan,
  'pending',
  'pending',
  'website'
FROM packages p
WHERE p.slug = 'nainital-darshan'
LIMIT 1;

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================

-- Verify data
SELECT 'Vehicles: ' || COUNT(*) FROM vehicles;
SELECT 'Destinations: ' || COUNT(*) FROM destinations;
SELECT 'Packages: ' || COUNT(*) FROM packages;
SELECT 'Seasons: ' || COUNT(*) FROM seasons;
SELECT 'Availability Days: ' || COUNT(*) FROM availability;
SELECT 'Reviews: ' || COUNT(*) FROM reviews;
SELECT 'Bookings: ' || COUNT(*) FROM bookings;
