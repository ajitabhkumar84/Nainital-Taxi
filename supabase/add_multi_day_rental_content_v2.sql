-- Multi-Day Rental Page: v2 content model
-- Adds hero trust badges, an inline Safety Promise section, a structured
-- (month/day-recurring) seasonality engine with an admin override, and a
-- 2-column SEO content block with a rich-text body + bullet highlights.
--
-- The three old free-text season date-range columns are RENAMED, not
-- dropped: whatever an admin already typed into them (which may differ
-- from the factory-default copy) must not be silently destroyed. The admin
-- UI shows the renamed columns as a read-only "previously entered" hint
-- next to the new structured picker until the new JSONB ranges are filled
-- in. A follow-up cleanup migration can drop the legacy_* columns once
-- that's confirmed done — not part of this migration.

-- Hero trust badges (qualitative chips, e.g. "Verified Drivers",
-- "Zero Alcohol Policy" — distinct from the existing numeric
-- hero_trust_indicators stat blocks).
ALTER TABLE multi_day_rental_page
  ADD COLUMN IF NOT EXISTS hero_trust_badges JSONB DEFAULT '[]'::jsonb;

-- Safety Promise section (inlined here rather than depending on the
-- never-implemented safety_section_reference / safety_sections table).
ALTER TABLE multi_day_rental_page
  ADD COLUMN IF NOT EXISTS safety_heading VARCHAR(255) DEFAULT 'Your Safety, Our Promise',
  ADD COLUMN IF NOT EXISTS safety_subheading TEXT DEFAULT 'Every trip is backed by these commitments to you',
  ADD COLUMN IF NOT EXISTS safety_pillars JSONB DEFAULT '[]'::jsonb;
-- Structure: [{ icon, title, description }], up to 4 pillars

-- Preserve the old free-text date ranges under a legacy_* name instead of
-- dropping them.
ALTER TABLE multi_day_rental_page
  RENAME COLUMN pricing_season_date_ranges TO legacy_pricing_season_date_ranges;
ALTER TABLE multi_day_rental_page
  RENAME COLUMN pricing_mid_season_date_ranges TO legacy_pricing_mid_season_date_ranges;
ALTER TABLE multi_day_rental_page
  RENAME COLUMN pricing_off_season_date_ranges TO legacy_pricing_off_season_date_ranges;

-- New structured, machine-comparable season ranges: recurring annually,
-- month/day only (no year), stored as {"start":"MM-DD","end":"MM-DD"}.
-- A range may wrap the year boundary (e.g. start "12-20", end "01-15") —
-- comparison logic for that lives in src/lib/seasonality.ts.
ALTER TABLE multi_day_rental_page
  ADD COLUMN IF NOT EXISTS pricing_season_ranges JSONB
    DEFAULT '[{"start":"04-15","end":"07-10"},{"start":"12-20","end":"01-15"}]'::jsonb,
  ADD COLUMN IF NOT EXISTS pricing_mid_season_ranges JSONB
    DEFAULT '[{"start":"07-11","end":"09-30"},{"start":"01-16","end":"04-14"}]'::jsonb,
  ADD COLUMN IF NOT EXISTS pricing_off_season_ranges JSONB
    DEFAULT '[{"start":"10-01","end":"12-19"}]'::jsonb;

-- Admin override for which pricing tier is shown as "active" on the public
-- page, instead of always relying on auto-detection from the ranges above.
ALTER TABLE multi_day_rental_page
  ADD COLUMN IF NOT EXISTS season_override VARCHAR(20) NOT NULL DEFAULT 'auto';

ALTER TABLE multi_day_rental_page DROP CONSTRAINT IF EXISTS multi_day_rental_page_season_override_check;
ALTER TABLE multi_day_rental_page
  ADD CONSTRAINT multi_day_rental_page_season_override_check
  CHECK (season_override IN ('auto', 'force_season', 'force_mid_season', 'force_off_season'));

-- 2-column SEO content block: rich-text body (left) + bullet highlights
-- (right). Admin-authored only, same trust boundary as the rest of this
-- CMS — never rendered from end-user input.
ALTER TABLE multi_day_rental_page
  ADD COLUMN IF NOT EXISTS seo_content_heading VARCHAR(255),
  ADD COLUMN IF NOT EXISTS seo_content_body TEXT,
  ADD COLUMN IF NOT EXISTS seo_content_highlights JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN multi_day_rental_page.hero_trust_badges IS 'Array of short trust-badge strings shown near the hero, e.g. "Verified Drivers"';
COMMENT ON COLUMN multi_day_rental_page.safety_pillars IS 'Array of up to 4 {icon, title, description} objects for the Safety Promise section';
COMMENT ON COLUMN multi_day_rental_page.pricing_season_ranges IS 'Recurring annual peak-season windows as [{"start":"MM-DD","end":"MM-DD"}], wraparound-safe';
COMMENT ON COLUMN multi_day_rental_page.pricing_mid_season_ranges IS 'Recurring annual mid-season windows, same shape as pricing_season_ranges';
COMMENT ON COLUMN multi_day_rental_page.pricing_off_season_ranges IS 'Recurring annual off-season windows, same shape as pricing_season_ranges';
COMMENT ON COLUMN multi_day_rental_page.season_override IS 'auto | force_season | force_mid_season | force_off_season — admin override for the active pricing tier shown on the public page';
COMMENT ON COLUMN multi_day_rental_page.legacy_pricing_season_date_ranges IS 'Deprecated free-text display strings, kept only so the admin can see what was previously entered while migrating to pricing_season_ranges. Safe to drop in a future migration once that migration is confirmed complete.';
COMMENT ON COLUMN multi_day_rental_page.legacy_pricing_mid_season_date_ranges IS 'Deprecated, see legacy_pricing_season_date_ranges';
COMMENT ON COLUMN multi_day_rental_page.legacy_pricing_off_season_date_ranges IS 'Deprecated, see legacy_pricing_season_date_ranges';
