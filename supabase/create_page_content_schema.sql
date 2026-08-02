-- ============================================
-- Page Content - Database Schema
-- ============================================
-- Per-page CMS content (SEO, hero override, section headings), one row per
-- page_slug. Starts with 'home'; future static pages (about, contact, ...)
-- just get an additional row here plus a matching admin/frontend route.

CREATE TABLE IF NOT EXISTS page_content (
  page_slug TEXT PRIMARY KEY,             -- 'home', 'about', 'contact', ...

  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',

  hero_image_url TEXT,                    -- NULL = keep existing seasonal rotation
  hero_title TEXT,                        -- NULL = keep existing seasonal rotation
  hero_subtitle TEXT,                     -- NULL = keep existing seasonal rotation

  -- Array of { key, heading, subheading }, seeded with the real section keys
  -- that already render on the page (see seed below).
  sections JSONB NOT NULL DEFAULT '[]',

  is_published BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE page_content IS 'Per-page CMS content (SEO, hero override, section headings). One row per page_slug.';

CREATE OR REPLACE FUNCTION update_page_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_page_content_updated_at ON page_content;
CREATE TRIGGER trigger_update_page_content_updated_at
  BEFORE UPDATE ON page_content
  FOR EACH ROW
  EXECUTE FUNCTION update_page_content_updated_at();

-- page_content: read via the anon-key client in queries_enhanced.ts for
-- SEO metadata + homepage section headings — needs public read.
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON page_content;
CREATE POLICY "Public read" ON page_content FOR SELECT USING (is_published = true);

-- Seed the 'home' row with the current hardcoded homepage copy, so running
-- this migration is a visual no-op until someone edits it in /admin/pages/home.
INSERT INTO page_content (page_slug, seo_title, seo_description, sections)
VALUES (
  'home',
  'Nainital Taxi - Premium Taxi & Tour Services in Nainital',
  'Book premium taxi services in Nainital. Reliable transfers from Kathgodam, Delhi, Pantnagar. Tour packages to Bhimtal, Naukuchiatal, Kainchi Dham & more. Best rates guaranteed.',
  '[
    {"key":"tours","heading":"Day tours and packages","subheading":"Great Itineraries & Best Prices"},
    {"key":"rentals","heading":"Multi-day rentals","subheading":""},
    {"key":"transfers","heading":"Fixed-fare transfers","subheading":"Transparent pricing for our most-booked routes. No surge, no haggling."},
    {"key":"destinations","heading":"Where we go","subheading":"Popular destinations across Nainital and Kumaon."},
    {"key":"testimonials","heading":"What guests say","subheading":"Real experiences from travelers like you."}
  ]'::jsonb
)
ON CONFLICT (page_slug) DO NOTHING;
