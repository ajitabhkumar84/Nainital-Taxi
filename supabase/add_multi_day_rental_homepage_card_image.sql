-- ============================================================================
-- APPLY THIS ONCE in the Supabase SQL Editor.
--
-- Adds a single column so the admin can set the photo used in the "Multi-Day
-- Rentals" card on the site homepage (/). That card previously had no image
-- field at all — the homepage just rendered a gray placeholder box.
--
-- WHY IT LIVES ON multi_day_rental_page: the homepage card already links to
-- /multi-day-rental, and that page's admin form (/admin/multi-day-rental)
-- already manages its own hero_image_url the same way. Reusing that table
-- avoids inventing a separate "homepage sections" image system for one field.
--
-- WHY THIS IS NEEDED: the admin save handler upserts the whole form body in
-- one statement. PostgREST rejects the ENTIRE upsert when any single column is
-- unknown, so until this runs, saving on the multi-day rental admin page will
-- fail wholesale once the form starts sending this field — the same failure
-- mode as APPLY_NOW_multi_day_rental_schema_sync.sql.
--
-- SAFETY: purely additive, nullable, no default. Re-running this file is safe.
-- Leaving it unset keeps the homepage's existing placeholder box.
-- ============================================================================

ALTER TABLE multi_day_rental_page
  ADD COLUMN IF NOT EXISTS homepage_card_image_url TEXT;

COMMENT ON COLUMN multi_day_rental_page.homepage_card_image_url IS
  'Photo shown in the "Multi-Day Rentals" card on the site homepage (/). Null/empty keeps the placeholder.';
