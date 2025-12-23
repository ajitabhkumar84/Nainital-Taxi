-- ============================================================================
-- DESTINATION PAGES - ADDITIONAL SEED DATA
-- ============================================================================
-- Adds missing destinations and transfer packages for Epic 2.2
-- Destinations: Pantnagar, Kathgodam, Jim Corbett
-- Transfer packages FROM Nainital TO all destinations
-- ============================================================================

-- ============================================================================
-- ADD MISSING DESTINATIONS
-- ============================================================================

-- Pantnagar (Airport)
INSERT INTO destinations (
  slug, name, tagline, description, highlights, best_time_to_visit, duration,
  distance_from_nainital, hero_image_url, emoji,
  meta_title, meta_description,
  is_popular, is_active, display_order
) VALUES
  ('pantnagar', 'Pantnagar Airport', 'Your Gateway to the Hills',
   'Pantnagar Airport serves as the nearest air connectivity point to Nainital, making your journey to the mountains smooth and convenient.',
   ARRAY['Nearest Airport to Nainital', 'Well-connected Domestic Flights', 'Quick 2-hour Transfer', 'Meet & Greet Service Available'],
   'Year Round', '2 hours drive', 65,
   'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200', '✈️',
   'Pantnagar Airport to Nainital Taxi Service - Book Affordable Cabs',
   'Book reliable taxi service from Pantnagar Airport to Nainital. Fixed rates, meet & greet service, comfortable AC vehicles. Starting from ₹2,800.',
   TRUE, TRUE, 10)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights,
  updated_at = CURRENT_TIMESTAMP;

-- Kathgodam (Railway Station)
INSERT INTO destinations (
  slug, name, tagline, description, highlights, best_time_to_visit, duration,
  distance_from_nainital, hero_image_url, emoji,
  meta_title, meta_description,
  is_popular, is_active, display_order
) VALUES
  ('kathgodam', 'Kathgodam Railway Station', 'Scenic Drives, Safe Arrivals',
   'Kathgodam Railway Station is the last major railway station before Nainital. Enjoy the breathtaking 1.5-hour mountain drive from Kathgodam to Nainital with our reliable taxi service.',
   ARRAY['Last Railway Station to Nainital', 'Scenic Mountain Drive', 'Well-maintained Roads', 'Experienced Hill Drivers'],
   'Year Round', '1.5 hours drive', 35,
   'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1200', '🚂',
   'Kathgodam to Nainital Taxi Service - Fixed Rate Cab Booking',
   'Book Kathgodam to Nainital taxi at affordable fixed rates. Pickup from railway station, comfortable AC cabs, experienced drivers. Starting from ₹1,500.',
   TRUE, TRUE, 11)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights,
  updated_at = CURRENT_TIMESTAMP;

-- Jim Corbett
INSERT INTO destinations (
  slug, name, tagline, description, highlights, best_time_to_visit, duration,
  distance_from_nainital, hero_image_url, emoji,
  meta_title, meta_description,
  is_popular, is_active, display_order
) VALUES
  ('jim-corbett', 'Jim Corbett National Park', 'Walk with the Wild',
   'Experience India''s oldest national park, famous for its Royal Bengal Tigers. Travel from Nainital to Jim Corbett for an unforgettable wildlife safari adventure.',
   ARRAY['India''s Oldest National Park', 'Royal Bengal Tigers', 'Elephant Safari', 'Rich Biodiversity', 'Ramganga River'],
   'November to June (Park closed during monsoon)', '3-4 hours drive', 115,
   'https://images.unsplash.com/photo-1604407971684-ffe67bfe6d3b?w=1200', '🐅',
   'Nainital to Jim Corbett Taxi Service - Wildlife Safari Transfer',
   'Book taxi from Nainital to Jim Corbett National Park. Comfortable vehicles, experienced drivers, affordable rates. Plan your wildlife adventure today!',
   TRUE, TRUE, 12)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights,
  updated_at = CURRENT_TIMESTAMP;

-- Update existing destinations with SEO meta tags if not present
UPDATE destinations SET
  meta_title = COALESCE(meta_title, 'Nainital to ' || name || ' Taxi Service - Book Affordable Cabs'),
  meta_description = COALESCE(meta_description, 'Book taxi from Nainital to ' || name || '. Reliable service, fixed rates, comfortable vehicles. Book your ride today!')
WHERE meta_title IS NULL OR meta_description IS NULL;

-- ============================================================================
-- CREATE TRANSFER PACKAGES FROM NAINITAL TO ALL DESTINATIONS
-- ============================================================================

-- Note: Kathgodam and Pantnagar packages already exist (as drops)
-- We'll add the reverse direction packages and new destination transfers

-- Nainital to Ranikhet Transfer
INSERT INTO packages (
  slug, title, type, duration, distance, places_covered, description, includes, excludes,
  destination_ids, image_url, is_popular, is_seasonal, availability_status,
  min_passengers, suitable_for,
  meta_title, meta_description,
  is_active, display_order
) VALUES
  ('nainital-ranikhet-transfer', 'Nainital to Ranikhet Transfer', 'transfer',
   '2.5 hours', 62,
   ARRAY['Nainital', 'Ranikhet'],
   'Comfortable transfer from Nainital to the serene cantonment town of Ranikhet, surrounded by pine forests and Himalayan views.',
   ARRAY['Experienced Driver', 'Fuel Charges', 'Tolls', 'Hill Permits'],
   ARRAY['Entry Fees at Destination', 'Food & Beverages'],
   (SELECT ARRAY[id] FROM destinations WHERE slug = 'ranikhet'),
   'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
   TRUE, FALSE, 'available', 1, ARRAY['families', 'couples', 'solo', 'groups'],
   'Nainital to Ranikhet Taxi - Book Cab at Fixed Rates',
   'Book taxi from Nainital to Ranikhet. Scenic mountain drive through pine forests. Comfortable AC vehicles, experienced drivers, affordable rates.',
   TRUE, 20)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- Nainital to Mukteshwar Transfer
INSERT INTO packages (
  slug, title, type, duration, distance, places_covered, description, includes, excludes,
  destination_ids, image_url, is_popular, is_seasonal, availability_status,
  min_passengers, suitable_for,
  meta_title, meta_description,
  is_active, display_order
) VALUES
  ('nainital-mukteshwar-transfer', 'Nainital to Mukteshwar Transfer', 'transfer',
   '1.5 hours', 51,
   ARRAY['Nainital', 'Mukteshwar'],
   'Scenic drive from Nainital to the beautiful hill station of Mukteshwar, known for its ancient temples and fruit orchards.',
   ARRAY['Experienced Driver', 'Fuel Charges', 'Hill Permits'],
   ARRAY['Entry Fees at Destination', 'Food & Beverages'],
   (SELECT ARRAY[id] FROM destinations WHERE slug = 'mukteshwar'),
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
   TRUE, FALSE, 'available', 1, ARRAY['families', 'couples', 'nature-lovers'],
   'Nainital to Mukteshwar Taxi - Affordable Hill Station Transfer',
   'Book taxi from Nainital to Mukteshwar. Enjoy scenic mountain views, comfortable rides, and reliable service at fixed affordable rates.',
   TRUE, 21)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- Nainital to Kainchi Dham Transfer
INSERT INTO packages (
  slug, title, type, duration, distance, places_covered, description, includes, excludes,
  destination_ids, image_url, is_popular, is_seasonal, availability_status,
  min_passengers, suitable_for,
  meta_title, meta_description,
  is_active, display_order
) VALUES
  ('nainital-kainchi-dham-transfer', 'Nainital to Kainchi Dham Transfer', 'transfer',
   '45 minutes', 17,
   ARRAY['Nainital', 'Kainchi Dham'],
   'Quick transfer from Nainital to the sacred Kainchi Dham Ashram, famous spiritual retreat of Neem Karoli Baba.',
   ARRAY['Experienced Driver', 'Fuel Charges', 'Parking'],
   ARRAY['Donations (Optional)', 'Prasad'],
   (SELECT ARRAY[id] FROM destinations WHERE slug = 'kainchi-dham'),
   'https://images.unsplash.com/photo-1590935217281-8f102120d683?w=800',
   TRUE, FALSE, 'available', 1, ARRAY['families', 'couples', 'spiritual', 'solo'],
   'Nainital to Kainchi Dham Taxi - Spiritual Journey Transfer',
   'Book taxi from Nainital to Kainchi Dham Ashram. Visit the famous temple of Neem Karoli Baba. Affordable rates, comfortable vehicles.',
   TRUE, 22)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- Nainital to Jim Corbett Transfer
INSERT INTO packages (
  slug, title, type, duration, distance, places_covered, description, includes, excludes,
  destination_ids, image_url, is_popular, is_seasonal, availability_status,
  min_passengers, suitable_for,
  meta_title, meta_description,
  is_active, display_order
) VALUES
  ('nainital-jim-corbett-transfer', 'Nainital to Jim Corbett Transfer', 'transfer',
   '3-4 hours', 115,
   ARRAY['Nainital', 'Jim Corbett National Park'],
   'Comfortable transfer from Nainital to Jim Corbett National Park for your wildlife safari adventure.',
   ARRAY['Experienced Driver', 'Fuel Charges', 'Tolls', 'Hill Permits'],
   ARRAY['Park Entry Fees', 'Safari Charges', 'Food & Beverages'],
   (SELECT ARRAY[id] FROM destinations WHERE slug = 'jim-corbett'),
   'https://images.unsplash.com/photo-1604407971684-ffe67bfe6d3b?w=800',
   TRUE, FALSE, 'available', 1, ARRAY['families', 'couples', 'adventure', 'wildlife-lovers'],
   'Nainital to Jim Corbett Taxi - Wildlife Safari Transfer',
   'Book taxi from Nainital to Jim Corbett National Park. Comfortable vehicles for your wildlife adventure. Fixed rates, experienced drivers.',
   TRUE, 23)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- ADD PRICING FOR ALL TRANSFER PACKAGES
-- ============================================================================

DO $$
DECLARE
  ranikhet_pkg_id UUID;
  mukteshwar_pkg_id UUID;
  kainchi_pkg_id UUID;
  corbett_pkg_id UUID;
BEGIN
  -- Get package IDs
  SELECT id INTO ranikhet_pkg_id FROM packages WHERE slug = 'nainital-ranikhet-transfer';
  SELECT id INTO mukteshwar_pkg_id FROM packages WHERE slug = 'nainital-mukteshwar-transfer';
  SELECT id INTO kainchi_pkg_id FROM packages WHERE slug = 'nainital-kainchi-dham-transfer';
  SELECT id INTO corbett_pkg_id FROM packages WHERE slug = 'nainital-jim-corbett-transfer';

  -- ======================================
  -- NAINITAL TO RANIKHET (62 km)
  -- ======================================
  INSERT INTO pricing (package_id, vehicle_type, season_name, price, notes) VALUES
    (ranikhet_pkg_id, 'sedan', 'Off-Season', 2800, 'Sedan off-season'),
    (ranikhet_pkg_id, 'suv_normal', 'Off-Season', 3200, 'SUV Basic off-season'),
    (ranikhet_pkg_id, 'suv_deluxe', 'Off-Season', 3800, 'SUV Deluxe off-season'),
    (ranikhet_pkg_id, 'suv_luxury', 'Off-Season', 4200, 'SUV Luxury off-season'),

    (ranikhet_pkg_id, 'sedan', 'Season', 3200, 'Sedan peak'),
    (ranikhet_pkg_id, 'suv_normal', 'Season', 3800, 'SUV Basic peak'),
    (ranikhet_pkg_id, 'suv_deluxe', 'Season', 4200, 'SUV Deluxe peak'),
    (ranikhet_pkg_id, 'suv_luxury', 'Season', 4800, 'SUV Luxury peak')
  ON CONFLICT (package_id, vehicle_type, season_name) DO UPDATE SET
    price = EXCLUDED.price,
    updated_at = CURRENT_TIMESTAMP;

  -- ======================================
  -- NAINITAL TO MUKTESHWAR (51 km)
  -- ======================================
  INSERT INTO pricing (package_id, vehicle_type, season_name, price, notes) VALUES
    (mukteshwar_pkg_id, 'sedan', 'Off-Season', 2500, 'Sedan off-season'),
    (mukteshwar_pkg_id, 'suv_normal', 'Off-Season', 3000, 'SUV Basic off-season'),
    (mukteshwar_pkg_id, 'suv_deluxe', 'Off-Season', 3500, 'SUV Deluxe off-season'),
    (mukteshwar_pkg_id, 'suv_luxury', 'Off-Season', 4000, 'SUV Luxury off-season'),

    (mukteshwar_pkg_id, 'sedan', 'Season', 3000, 'Sedan peak'),
    (mukteshwar_pkg_id, 'suv_normal', 'Season', 3500, 'SUV Basic peak'),
    (mukteshwar_pkg_id, 'suv_deluxe', 'Season', 4000, 'SUV Deluxe peak'),
    (mukteshwar_pkg_id, 'suv_luxury', 'Season', 4500, 'SUV Luxury peak')
  ON CONFLICT (package_id, vehicle_type, season_name) DO UPDATE SET
    price = EXCLUDED.price,
    updated_at = CURRENT_TIMESTAMP;

  -- ======================================
  -- NAINITAL TO KAINCHI DHAM (17 km)
  -- ======================================
  INSERT INTO pricing (package_id, vehicle_type, season_name, price, notes) VALUES
    (kainchi_pkg_id, 'sedan', 'Off-Season', 1200, 'Sedan off-season'),
    (kainchi_pkg_id, 'suv_normal', 'Off-Season', 1500, 'SUV Basic off-season'),
    (kainchi_pkg_id, 'suv_deluxe', 'Off-Season', 1800, 'SUV Deluxe off-season'),
    (kainchi_pkg_id, 'suv_luxury', 'Off-Season', 2200, 'SUV Luxury off-season'),

    (kainchi_pkg_id, 'sedan', 'Season', 1500, 'Sedan peak'),
    (kainchi_pkg_id, 'suv_normal', 'Season', 1800, 'SUV Basic peak'),
    (kainchi_pkg_id, 'suv_deluxe', 'Season', 2200, 'SUV Deluxe peak'),
    (kainchi_pkg_id, 'suv_luxury', 'Season', 2500, 'SUV Luxury peak')
  ON CONFLICT (package_id, vehicle_type, season_name) DO UPDATE SET
    price = EXCLUDED.price,
    updated_at = CURRENT_TIMESTAMP;

  -- ======================================
  -- NAINITAL TO JIM CORBETT (115 km)
  -- ======================================
  INSERT INTO pricing (package_id, vehicle_type, season_name, price, notes) VALUES
    (corbett_pkg_id, 'sedan', 'Off-Season', 4500, 'Sedan off-season'),
    (corbett_pkg_id, 'suv_normal', 'Off-Season', 5500, 'SUV Basic off-season'),
    (corbett_pkg_id, 'suv_deluxe', 'Off-Season', 6500, 'SUV Deluxe off-season'),
    (corbett_pkg_id, 'suv_luxury', 'Off-Season', 7500, 'SUV Luxury off-season'),

    (corbett_pkg_id, 'sedan', 'Season', 5500, 'Sedan peak'),
    (corbett_pkg_id, 'suv_normal', 'Season', 6500, 'SUV Basic peak'),
    (corbett_pkg_id, 'suv_deluxe', 'Season', 7500, 'SUV Deluxe peak'),
    (corbett_pkg_id, 'suv_luxury', 'Season', 8500, 'SUV Luxury peak')
  ON CONFLICT (package_id, vehicle_type, season_name) DO UPDATE SET
    price = EXCLUDED.price,
    updated_at = CURRENT_TIMESTAMP;

END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- List all destinations
SELECT slug, name, distance_from_nainital, is_active FROM destinations ORDER BY display_order;

-- List all transfer packages
SELECT slug, title, duration, distance FROM packages WHERE type = 'transfer' ORDER BY display_order;

-- Count pricing entries per package
SELECT
  p.title,
  COUNT(pr.id) as pricing_count
FROM packages p
LEFT JOIN pricing pr ON pr.package_id = p.id
WHERE p.type = 'transfer'
GROUP BY p.id, p.title
ORDER BY p.display_order;
