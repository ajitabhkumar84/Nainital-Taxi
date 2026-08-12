-- ============================================================================
-- ONE-WAY TAXI (/rates) — settings singleton + route→destination link
-- ============================================================================
-- Backs the /rates redesign and its /admin/one-way-taxi control panel.
--
-- Three independent, idempotent pieces:
--   1. routes.destination_slug — optional link from a route to a
--      /destinations/[slug] page. NULL means "no destination page for this
--      route" (Condition B: the /rates row shows only a "Book" button).
--      Deliberately not a foreign key: the admin dropdown already constrains
--      it to real destination slugs, and a hard FK would block deleting a
--      destination that a route still references.
--   2. A one-off backfill of routes.display_order — every row was seeded at
--      the column default of 0, so ORDER BY display_order alone ties on
--      every row and Postgres breaks the tie by physical row order, which
--      silently reshuffles after any UPDATE. This assigns a stable 1..N
--      sequence (by created_at) to any row still sitting at 0, without
--      touching rows an admin has already reordered.
--   3. one_way_taxi_settings — singleton table for the /rates hero heading,
--      subheading, three stat blocks, and SEO title/description. Same
--      fixed-UUID singleton pattern as contact_page_content (see
--      supabase/create_contact_page_schema.sql) — ...0001 through ...0004
--      are already taken, so this is ...0005.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. routes.destination_slug
-- ----------------------------------------------------------------------------

ALTER TABLE routes ADD COLUMN IF NOT EXISTS destination_slug TEXT;

COMMENT ON COLUMN routes.destination_slug IS
  'Optional slug of a destinations row this route should link to on /rates. '
  'Set -> the route card shows "View Details" (-> /destinations/{slug}) '
  'alongside "Book". NULL -> the card shows only "Book", so a route never '
  'links to a page that does not exist.';

-- ----------------------------------------------------------------------------
-- 2. Backfill display_order to break the all-zero tie
-- ----------------------------------------------------------------------------

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM routes
)
UPDATE routes r
SET display_order = ordered.rn
FROM ordered
WHERE r.id = ordered.id
  AND r.display_order = 0;

-- ----------------------------------------------------------------------------
-- 3. one_way_taxi_settings singleton
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS one_way_taxi_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000005',

  -- Hero
  hero_heading    TEXT NOT NULL DEFAULT '',
  hero_subheading TEXT NOT NULL DEFAULT '',

  -- Three stat blocks shown under the hero (e.g. "500+" / "Happy Travelers")
  stat_1_value TEXT NOT NULL DEFAULT '',
  stat_1_label TEXT NOT NULL DEFAULT '',
  stat_2_value TEXT NOT NULL DEFAULT '',
  stat_2_label TEXT NOT NULL DEFAULT '',
  stat_3_value TEXT NOT NULL DEFAULT '',
  stat_3_label TEXT NOT NULL DEFAULT '',

  -- SEO — only meaningful once /rates is server-rendered and can actually
  -- emit a real <title>/<meta name="description"> per admin edit.
  seo_title       TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE one_way_taxi_settings IS
  'Singleton config for the /rates (One-Way Transfers) page hero and stat '
  'blocks, edited from /admin/one-way-taxi. Always exactly one row, id '
  '00000000-0000-0000-0000-000000000005.';

-- Seed with the values that were previously hardcoded in src/app/rates/page.tsx.
-- ON CONFLICT DO NOTHING so re-running this file never overwrites an admin edit.
INSERT INTO one_way_taxi_settings (
  id, hero_heading, hero_subheading,
  stat_1_value, stat_1_label,
  stat_2_value, stat_2_label,
  stat_3_value, stat_3_label,
  seo_title, seo_description
) VALUES (
  '00000000-0000-0000-0000-000000000005',
  'Transfer Routes',
  'Browse all available taxi routes from Nainital. Fixed rates, no hidden charges, comfortable vehicles.',
  '500+', 'Happy Travelers',
  '24/7', 'Support',
  '15+', 'Years',
  'One-Way Taxi Fares & Routes | Nainital Taxi',
  'Transparent one-way taxi fares from Nainital to Kathgodam, Delhi, Pantnagar and more. Fixed rates, no hidden charges, professional drivers.'
)
ON CONFLICT (id) DO NOTHING;

-- updated_at trigger — same helper-function-per-table convention as
-- update_routes_updated_at() / update_route_categories_updated_at().
CREATE OR REPLACE FUNCTION update_one_way_taxi_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_one_way_taxi_settings_updated_at ON one_way_taxi_settings;
CREATE TRIGGER trigger_one_way_taxi_settings_updated_at
  BEFORE UPDATE ON one_way_taxi_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_one_way_taxi_settings_updated_at();

-- RLS — read via the anon-key client on /rates (see src/lib/oneWayTaxi.ts);
-- writes only ever go through the service-role client in
-- /api/admin/one-way-taxi. Matches the public-read policies in
-- supabase/harden_rls_new_tables.sql.
ALTER TABLE one_way_taxi_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON one_way_taxi_settings;
CREATE POLICY "Public read" ON one_way_taxi_settings FOR SELECT USING (true);
