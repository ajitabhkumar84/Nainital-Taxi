-- ============================================================================
-- APPLY THIS ONCE in the Supabase SQL Editor.
--
-- Combines the two migrations that were written on Aug 4 but never applied:
--   1. add_multi_day_rental_page_slug.sql
--   2. add_multi_day_rental_content_v2.sql
--
-- WHY THIS IS NEEDED: the app code writes columns (page_slug, safety_pillars,
-- pricing_*_ranges, season_override, hero_trust_badges, seo_content_*) that do
-- not exist in the database yet. PostgREST rejects the ENTIRE upsert when any
-- one column is unknown, so every admin "Save" fails wholesale — which is why
-- the hero image and car prices never persisted.
--
-- SAFETY: purely additive. Columns are added with IF NOT EXISTS; the three old
-- free-text season columns are RENAMED (not dropped) so nothing already typed
-- in is destroyed. Re-running this file is safe.
-- ============================================================================

-- ---------------------------------------------------------------- page_slug
ALTER TABLE multi_day_rental_page
  ADD COLUMN IF NOT EXISTS page_slug TEXT NOT NULL DEFAULT 'multi-day-rental';

UPDATE multi_day_rental_page
SET page_slug = 'multi-day-rental'
WHERE page_slug IS NULL OR page_slug = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'multi_day_rental_page_slug_unique'
  ) THEN
    ALTER TABLE multi_day_rental_page
      ADD CONSTRAINT multi_day_rental_page_slug_unique UNIQUE (page_slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_multi_day_rental_page_slug
  ON multi_day_rental_page(page_slug);

-- ------------------------------------------------------- hero trust badges
ALTER TABLE multi_day_rental_page
  ADD COLUMN IF NOT EXISTS hero_trust_badges JSONB DEFAULT '[]'::jsonb;

-- ---------------------------------------------------- safety promise block
ALTER TABLE multi_day_rental_page
  ADD COLUMN IF NOT EXISTS safety_heading VARCHAR(255) DEFAULT 'Your Safety, Our Promise',
  ADD COLUMN IF NOT EXISTS safety_subheading TEXT DEFAULT 'Every trip is backed by these commitments to you',
  ADD COLUMN IF NOT EXISTS safety_pillars JSONB DEFAULT '[]'::jsonb;

-- ------------------------- rename legacy free-text season ranges (not drop)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'multi_day_rental_page'
               AND column_name = 'pricing_season_date_ranges')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'multi_day_rental_page'
               AND column_name = 'legacy_pricing_season_date_ranges') THEN
    ALTER TABLE multi_day_rental_page
      RENAME COLUMN pricing_season_date_ranges TO legacy_pricing_season_date_ranges;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'multi_day_rental_page'
               AND column_name = 'pricing_mid_season_date_ranges')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'multi_day_rental_page'
               AND column_name = 'legacy_pricing_mid_season_date_ranges') THEN
    ALTER TABLE multi_day_rental_page
      RENAME COLUMN pricing_mid_season_date_ranges TO legacy_pricing_mid_season_date_ranges;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'multi_day_rental_page'
               AND column_name = 'pricing_off_season_date_ranges')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'multi_day_rental_page'
               AND column_name = 'legacy_pricing_off_season_date_ranges') THEN
    ALTER TABLE multi_day_rental_page
      RENAME COLUMN pricing_off_season_date_ranges TO legacy_pricing_off_season_date_ranges;
  END IF;
END $$;

-- --------------------------------------- structured seasonality + override
ALTER TABLE multi_day_rental_page
  ADD COLUMN IF NOT EXISTS pricing_season_ranges JSONB
    DEFAULT '[{"start":"04-15","end":"07-10"},{"start":"12-20","end":"01-15"}]'::jsonb,
  ADD COLUMN IF NOT EXISTS pricing_mid_season_ranges JSONB
    DEFAULT '[{"start":"07-11","end":"09-30"},{"start":"01-16","end":"04-14"}]'::jsonb,
  ADD COLUMN IF NOT EXISTS pricing_off_season_ranges JSONB
    DEFAULT '[{"start":"10-01","end":"12-19"}]'::jsonb;

ALTER TABLE multi_day_rental_page
  ADD COLUMN IF NOT EXISTS season_override VARCHAR(20) NOT NULL DEFAULT 'auto';

ALTER TABLE multi_day_rental_page
  DROP CONSTRAINT IF EXISTS multi_day_rental_page_season_override_check;
ALTER TABLE multi_day_rental_page
  ADD CONSTRAINT multi_day_rental_page_season_override_check
  CHECK (season_override IN ('auto', 'force_season', 'force_mid_season', 'force_off_season'));

-- ------------------------------------------------------- SEO content block
ALTER TABLE multi_day_rental_page
  ADD COLUMN IF NOT EXISTS seo_content_heading VARCHAR(255),
  ADD COLUMN IF NOT EXISTS seo_content_body TEXT,
  ADD COLUMN IF NOT EXISTS seo_content_highlights JSONB DEFAULT '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- Point the page at its live URL: /taxi-rental
-- ---------------------------------------------------------------------------
UPDATE multi_day_rental_page
SET page_slug = 'taxi-rental'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Sanity check — should return page_slug = 'taxi-rental' and is_published = true
SELECT page_slug, is_published, hero_image_url,
       jsonb_array_length(COALESCE(car_categories, '[]'::jsonb)) AS car_count
FROM multi_day_rental_page
WHERE id = '00000000-0000-0000-0000-000000000001';
