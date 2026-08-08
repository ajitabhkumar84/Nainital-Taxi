-- ============================================
-- Tour Page Trust Section - Database Schema
-- ============================================
-- Singleton config table for the "Why Families Trust Us" section shown on
-- individual tour package pages (/tour/[name]). Deliberately separate from
-- trust_section (the homepage's version, see create_trust_section_schema.sql) —
-- same fixed-UUID singleton pattern, different id. No image_url column: the
-- tour-page card grid design doesn't use one.

CREATE TABLE IF NOT EXISTS tour_trust_section (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000003',

  heading TEXT NOT NULL DEFAULT 'Why Families Trust Us',
  description TEXT NOT NULL DEFAULT 'Your safety matters more than the lowest fare',

  -- Array of { icon_name, title, description, display_order, is_active }
  trust_pillars JSONB NOT NULL DEFAULT '[]',

  is_published BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT tour_trust_section_singleton CHECK (id = '00000000-0000-0000-0000-000000000003')
);

COMMENT ON TABLE tour_trust_section IS 'Singleton config for the tour package pages'' Why Families Trust Us section (heading, description, trust pillars)';

CREATE OR REPLACE FUNCTION update_tour_trust_section_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tour_trust_section_updated_at ON tour_trust_section;
CREATE TRIGGER trigger_update_tour_trust_section_updated_at
  BEFORE UPDATE ON tour_trust_section
  FOR EACH ROW
  EXECUTE FUNCTION update_tour_trust_section_updated_at();

-- Seed with the current hardcoded tour-page copy so the migration is a no-op visually.
INSERT INTO tour_trust_section (id, heading, description, trust_pillars, is_published)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Why Families Trust Us',
  'Your safety matters more than the lowest fare',
  '[
    {"icon_name": "shield", "title": "Zero Alcohol Policy", "description": "Strict sobriety standards with no exceptions", "display_order": 1, "is_active": true},
    {"icon_name": "user-check", "title": "Verified Drivers", "description": "Background-checked, trained professionals", "display_order": 2, "is_active": true},
    {"icon_name": "heart", "title": "Family-First Care", "description": "Drivers who treat you like their own family", "display_order": 3, "is_active": true},
    {"icon_name": "award", "title": "10,000+ Safe Trips", "description": "Trusted by families across India", "display_order": 4, "is_active": true}
  ]'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;
