-- Migration: Add landing-page support fields to routes table
-- ============================================================================
-- Part of the WordPress -> Next.js migration: the old site had 10 dedicated
-- city/route pages (e.g. /delhi-taxi/, /haridwar/) targeting long-tail
-- "Nainital to X taxi" search queries. The new site previously collapsed all
-- routes into a single /rates table with no per-route detail page. This adds
-- the two fields the new /routes/[slug] landing-page template needs, and
-- seeds skeleton rows for the 8 consolidated city pages (10 old URLs -> 8 new
-- pages; /kathgodam + /railway-station share one page, as do /ranikhet-taxi +
-- /ranikheet-sightseeing).
-- ============================================================================

ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS show_as_route_page BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN routes.hero_image_url IS 'Optional hero image for the /routes/[slug] landing page. Falls back to a seasonal default image when null.';
COMMENT ON COLUMN routes.show_as_route_page IS 'Explicit opt-in: only routes with this true get a public /routes/[slug] SEO landing page and appear in sitemap.xml. Default false so auto-generated reverse routes and ordinary pricing-table rows do not silently become indexable pages.';

-- Seed skeleton rows for the WordPress migration's city/route landing pages.
-- Slug/pickup/drop only — pricing, distance, description, and hero image are
-- intentionally left blank for the admin to fill in via /admin/routes.
-- is_active starts false so the page 404s (rather than showing an empty page)
-- until the admin has filled it in and flipped it live.
INSERT INTO routes (slug, pickup_location, drop_location, is_active, show_as_route_page)
VALUES
  ('haridwar', 'Nainital', 'Haridwar', false, true),
  ('kathgodam', 'Nainital', 'Kathgodam', false, true),
  ('delhi', 'Nainital', 'Delhi', false, true),
  ('pantnagar-airport', 'Nainital', 'Pantnagar Airport', false, true),
  ('ranikhet', 'Nainital', 'Ranikhet', false, true),
  ('almora', 'Nainital', 'Almora', false, true),
  ('kausani', 'Nainital', 'Kausani', false, true),
  ('dehradun', 'Nainital', 'Dehradun', false, true)
ON CONFLICT (slug) DO NOTHING;
