-- ============================================
-- Trust & Safety Section - Database Schema
-- ============================================
-- Singleton config table for the homepage "Why families trust us" section,
-- following the same fixed-UUID singleton pattern as multi_day_rental_page.

CREATE TABLE IF NOT EXISTS trust_section (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000002',

  heading TEXT NOT NULL DEFAULT 'Why families trust us',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT, -- photo shown beside the section; null = show placeholder

  -- Array of { icon_name, title, description, display_order, is_active }
  trust_pillars JSONB NOT NULL DEFAULT '[]',

  is_published BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT trust_section_singleton CHECK (id = '00000000-0000-0000-0000-000000000002')
);

COMMENT ON TABLE trust_section IS 'Singleton config for the homepage Trust & Safety section (heading, description, trust pillars)';

CREATE OR REPLACE FUNCTION update_trust_section_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_trust_section_updated_at ON trust_section;
CREATE TRIGGER trigger_update_trust_section_updated_at
  BEFORE UPDATE ON trust_section
  FOR EACH ROW
  EXECUTE FUNCTION update_trust_section_updated_at();

-- Seed with the current hardcoded homepage copy so the migration is a no-op visually.
INSERT INTO trust_section (id, heading, description, trust_pillars, is_published)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Why families trust us',
  'Every driver is background-verified and professionally trained. Your safety is not an afterthought — it is the foundation of how we operate.',
  '[
    {"icon_name": "heart", "title": "Family values", "description": "Drivers are trained to treat every passenger with the care and respect they would give their own family.", "display_order": 1, "is_active": true},
    {"icon_name": "car", "title": "Well-maintained vehicles", "description": "Our cars are regularly checked and serviced to ensure a comfortable, reliable, and safe journey.", "display_order": 2, "is_active": true},
    {"icon_name": "user-check", "title": "Verified drivers", "description": "Comprehensive background verification, license validation, and character reference checks are mandatory before anyone joins our team.", "display_order": 3, "is_active": true},
    {"icon_name": "award", "title": "Professional training", "description": "Our team undergoes strict defensive driving and customer service training to provide the best possible experience.", "display_order": 4, "is_active": true},
    {"icon_name": "phone", "title": "Reliable on-road assistance", "description": "A dedicated support team is always just a call away to help you out during your trip.", "display_order": 5, "is_active": true}
  ]'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;
