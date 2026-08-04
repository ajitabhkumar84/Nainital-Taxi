-- Adds a customizable public URL slug to the multi-day rental page so an
-- admin can change the page's route (e.g. away from the default
-- "multi-day-rental") without any developer/code involvement.

ALTER TABLE multi_day_rental_page
  ADD COLUMN IF NOT EXISTS page_slug TEXT NOT NULL DEFAULT 'multi-day-rental';

-- Backfill defensively in case the row was inserted with an explicit column
-- list that predates this migration.
UPDATE multi_day_rental_page
SET page_slug = 'multi-day-rental'
WHERE page_slug IS NULL OR page_slug = '';

-- Single-row table today (single_row_check), but a real uniqueness
-- constraint lets us upsert safely and gives Postgres (not just app code)
-- the last word if that ever changes.
ALTER TABLE multi_day_rental_page
  ADD CONSTRAINT multi_day_rental_page_slug_unique UNIQUE (page_slug);

CREATE INDEX IF NOT EXISTS idx_multi_day_rental_page_slug
  ON multi_day_rental_page(page_slug);

COMMENT ON COLUMN multi_day_rental_page.page_slug IS
  'Public URL path segment for this page (e.g. "multi-day-rental" renders at /multi-day-rental). Must match ^[a-z0-9]+(?:-[a-z0-9]+)*$ and avoid reserved top-level route names; both are enforced in src/app/api/admin/multi-day-rental/route.ts, not just the DB.';
