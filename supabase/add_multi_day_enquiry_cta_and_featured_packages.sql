-- ============================================================================
-- APPLY THIS ONCE in the Supabase SQL Editor.
--
-- Adds the columns behind two new sections on the multi-day rental page:
--   1. Enquiry CTA  — the conversion block that now sits directly under the
--      inclusions/exclusions section (previously a dead end).
--   2. Featured Packages — real `packages` rows the admin hand-picks for this
--      page, replacing the removed "Choose Your Duration" section.
--
-- WHY THIS IS NEEDED: the admin save handler upserts the whole form body in
-- one statement. PostgREST rejects the ENTIRE upsert when any single column is
-- unknown, so until this runs every "Save" on the multi-day rental admin page
-- fails wholesale — the same failure mode as
-- APPLY_NOW_multi_day_rental_schema_sync.sql.
--
-- SAFETY: purely additive. Every column uses ADD COLUMN IF NOT EXISTS and
-- nothing is dropped or renamed. Re-running this file is safe.
--
-- NOTE on the featured-packages columns: they are declared in
-- create_multiday_rental_page.sql, but this table has drifted from that file
-- before (see APPLY_NOW_...sql), so they are re-added defensively here. If they
-- already exist these statements are no-ops.
-- ============================================================================

-- ------------------------------------------------------------- enquiry CTA
ALTER TABLE multi_day_rental_page
  ADD COLUMN IF NOT EXISTS enquiry_cta_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS enquiry_cta_heading VARCHAR(255) NOT NULL
    DEFAULT 'Not sure which plan fits your trip?',
  ADD COLUMN IF NOT EXISTS enquiry_cta_description TEXT NOT NULL
    DEFAULT 'Send us your dates and the places you want to cover. We reply with an exact, all-inclusive quote — no obligation.',
  ADD COLUMN IF NOT EXISTS enquiry_cta_whatsapp_label VARCHAR(120) NOT NULL
    DEFAULT 'Send Your Enquiry on WhatsApp',
  ADD COLUMN IF NOT EXISTS enquiry_cta_whatsapp_message TEXT NOT NULL
    DEFAULT 'Hi! I would like a quote for a multi-day taxi rental. My travel dates are ______ and I want to cover ______.',
  ADD COLUMN IF NOT EXISTS enquiry_cta_secondary_label VARCHAR(120) NOT NULL
    DEFAULT 'Use the Enquiry Form',
  ADD COLUMN IF NOT EXISTS enquiry_cta_secondary_href VARCHAR(255) NOT NULL
    DEFAULT '/contact',
  ADD COLUMN IF NOT EXISTS enquiry_cta_reassurance VARCHAR(255) NOT NULL
    DEFAULT 'Usually replies within 10 minutes · 8 AM – 10 PM';

COMMENT ON COLUMN multi_day_rental_page.enquiry_cta_enabled IS
  'Show the enquiry CTA block below the inclusions/exclusions section';
COMMENT ON COLUMN multi_day_rental_page.enquiry_cta_whatsapp_message IS
  'Pre-filled WhatsApp text for the enquiry CTA button';
COMMENT ON COLUMN multi_day_rental_page.enquiry_cta_secondary_href IS
  'Secondary CTA target — an internal path such as /contact, or a full URL';

-- ------------------------------------------------------- featured packages
ALTER TABLE multi_day_rental_page
  ADD COLUMN IF NOT EXISTS popular_itineraries_heading VARCHAR(255) NOT NULL
    DEFAULT 'Popular Tour Itineraries',
  ADD COLUMN IF NOT EXISTS popular_itineraries_subheading TEXT NOT NULL
    DEFAULT 'Handpicked routes designed by local experts. Pick one or customize your own adventure.',
  ADD COLUMN IF NOT EXISTS featured_package_ids UUID[] DEFAULT ARRAY[]::UUID[];

COMMENT ON COLUMN multi_day_rental_page.featured_package_ids IS
  'Admin-picked packages.id values, stored in display order, rendered in the Featured Packages section';

-- ============================================================================
-- DEPRECATED, INTENTIONALLY NOT DROPPED
--
-- packages_heading, packages_subheading, package_1..package_4 backed the
-- "Choose Your Duration" section, which has been removed from the public page
-- and from the admin form. The columns are retained so the copy already typed
-- into them is not destroyed and the section can be restored if needed.
-- ============================================================================
