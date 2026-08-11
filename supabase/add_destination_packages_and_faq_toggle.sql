-- Migration: Link tour packages to destinations + make the FAQ section toggleable
--
-- Adds two columns to `destinations`:
--   package_ids — tour packages cross-sold on /destinations/[slug]
--   show_faqs   — admin switch for the FAQ section on that page
--
-- `hero_image_url` already exists (schema_enhanced.sql) — no change needed there.

ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS package_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS show_faqs BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN destinations.package_ids IS
  'Tour packages cross-sold on this destination page. Soft reference to packages.id — no FK, since this is an array column. Stale IDs are harmless: the read path filters on is_active = true.';

COMMENT ON COLUMN destinations.show_faqs IS
  'Controls whether the FAQ section renders on /destinations/[slug]. Defaults to true so existing rows keep their current behaviour.';
