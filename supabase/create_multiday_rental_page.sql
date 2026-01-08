-- Multi-Day Rental Page Schema
-- This table stores all content for the multi-day taxi rental page
-- Single row table - only one page configuration

CREATE TABLE IF NOT EXISTS multi_day_rental_page (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- SEO & Meta Data
  seo_title VARCHAR(255) NOT NULL DEFAULT 'Multi-Day Car Rental in Uttarakhand | Nainital Taxi',
  seo_description TEXT NOT NULL DEFAULT 'Book multi-day car rentals for complete Uttarakhand tours. Transparent seasonal pricing, flexible packages, and professional drivers.',
  seo_keywords TEXT DEFAULT 'multi-day car rental, Uttarakhand tour, taxi booking, seasonal pricing',

  -- Hero Section
  hero_badge VARCHAR(255) NOT NULL DEFAULT 'Trusted by 500+ Happy Travelers',
  hero_headline_line1 VARCHAR(255) NOT NULL DEFAULT 'Your Complete',
  hero_headline_line2 VARCHAR(255) NOT NULL DEFAULT 'Uttarakhand Journey',
  hero_headline_line3 VARCHAR(255) NOT NULL DEFAULT 'Awaits',
  hero_subheadline TEXT NOT NULL DEFAULT 'Experience the Himalayas with our multi-day car rental service. Professional drivers, well-maintained vehicles, and flexible itineraries.',
  hero_image_url TEXT,
  hero_trust_indicators JSONB DEFAULT '[
    {"number": "500+", "label": "Happy Travelers"},
    {"number": "15+", "label": "Years Experience"},
    {"number": "24/7", "label": "Support"}
  ]'::jsonb,

  -- Pricing Section
  pricing_heading VARCHAR(255) NOT NULL DEFAULT 'Choose Your Ride',
  pricing_subheading TEXT NOT NULL DEFAULT 'Per day rates for various car categories - transparent pricing for every season',
  pricing_season_label VARCHAR(100) NOT NULL DEFAULT 'Season Rates',
  pricing_season_date_ranges TEXT[] DEFAULT ARRAY['15 Apr - 10 Jul', '20 Dec - 15 Jan'],
  pricing_season_description VARCHAR(255) DEFAULT 'Peak tourist season',
  pricing_mid_season_label VARCHAR(100) NOT NULL DEFAULT 'Mid Season',
  pricing_mid_season_date_ranges TEXT[] DEFAULT ARRAY['11 Jul - 30 Sep', '16 Jan - 14 Apr'],
  pricing_mid_season_description VARCHAR(255) DEFAULT 'Moderate season',
  pricing_off_season_label VARCHAR(100) NOT NULL DEFAULT 'Off-Season Rates',
  pricing_off_season_date_ranges TEXT[] DEFAULT ARRAY['1 Oct - 19 Dec'],
  pricing_off_season_description VARCHAR(255) DEFAULT 'Off-peak season',
  pricing_note_text TEXT DEFAULT 'Above charges are general rates. Exact charges depend on itinerary and number of days.',

  -- Car Categories (stored as JSONB array)
  car_categories JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ name, vehicles, image_url, season_price, mid_season_price, off_season_price, is_popular, order }]

  -- Inclusion/Exclusion Section
  inclusion_exclusion_heading VARCHAR(255) NOT NULL DEFAULT 'What''s Included & Excluded',
  inclusion_exclusion_subheading VARCHAR(255) NOT NULL DEFAULT 'Complete transparency - know exactly what you''re paying for',
  items_included JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ title, description }]
  items_excluded JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ title, description }]

  -- Tour Duration Packages Section
  packages_heading VARCHAR(255) NOT NULL DEFAULT 'Choose Your Duration',
  packages_subheading TEXT NOT NULL DEFAULT 'Flexible packages tailored to your journey. The longer you travel, the more you save!',
  package_1 JSONB DEFAULT '{}'::jsonb,
  package_2 JSONB DEFAULT '{}'::jsonb,
  package_3 JSONB DEFAULT '{}'::jsonb,
  package_4 JSONB DEFAULT '{}'::jsonb,
  -- Structure: { badge, duration, subtitle, features: [{text, is_bold}], whatsapp_message, is_popular, is_custom_package }

  -- Popular Itineraries Section
  popular_itineraries_heading VARCHAR(255) NOT NULL DEFAULT 'Popular Tour Itineraries',
  popular_itineraries_subheading TEXT NOT NULL DEFAULT 'Handpicked routes designed by local experts. Pick one or customize your own adventure.',
  featured_package_ids UUID[] DEFAULT ARRAY[]::UUID[],
  -- References to existing packages table

  -- Safety Section Reference
  safety_section_reference UUID,
  -- Reference to safety_sections table if it exists, or we can inline it

  -- FAQs Section
  faq_heading VARCHAR(255) NOT NULL DEFAULT 'Frequently Asked Questions',
  faq_subheading VARCHAR(255) NOT NULL DEFAULT 'Everything you need to know about multi-day car rentals',
  faqs JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ question, answer }]

  -- CTA Section
  cta_heading VARCHAR(255) NOT NULL DEFAULT 'Ready to Explore Uttarakhand?',
  cta_description TEXT NOT NULL DEFAULT 'Book your multi-day car rental today and experience Uttarakhand like never before. Flexible plans, transparent pricing, and unforgettable memories await.',
  cta_features JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ text }]

  -- Metadata
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure only one row in this table
  CONSTRAINT single_row_check CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_multi_day_rental_page_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_multi_day_rental_page_timestamp
  BEFORE UPDATE ON multi_day_rental_page
  FOR EACH ROW
  EXECUTE FUNCTION update_multi_day_rental_page_updated_at();

-- Insert default configuration
INSERT INTO multi_day_rental_page (id)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE multi_day_rental_page ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public can read, authenticated users can manage (for admin)
CREATE POLICY "Public can view multi-day rental page"
  ON multi_day_rental_page
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update multi-day rental page"
  ON multi_day_rental_page
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_multi_day_rental_page_published ON multi_day_rental_page(is_published);

-- Comments
COMMENT ON TABLE multi_day_rental_page IS 'Configuration for the multi-day car rental landing page - single row table';
COMMENT ON COLUMN multi_day_rental_page.car_categories IS 'Array of car category objects with pricing for different seasons';
COMMENT ON COLUMN multi_day_rental_page.items_included IS 'Array of items included in the rental';
COMMENT ON COLUMN multi_day_rental_page.items_excluded IS 'Array of items not included in the rental';
COMMENT ON COLUMN multi_day_rental_page.package_1 IS 'Tour duration package 1 (typically 3-4 days)';
COMMENT ON COLUMN multi_day_rental_page.package_2 IS 'Tour duration package 2 (typically 5-7 days)';
COMMENT ON COLUMN multi_day_rental_page.package_3 IS 'Tour duration package 3 (typically 8-10 days)';
COMMENT ON COLUMN multi_day_rental_page.package_4 IS 'Tour duration package 4 (typically custom)';
COMMENT ON COLUMN multi_day_rental_page.featured_package_ids IS 'Array of package UUIDs to feature in popular itineraries section';
COMMENT ON COLUMN multi_day_rental_page.faqs IS 'Array of FAQ objects with question and answer';
