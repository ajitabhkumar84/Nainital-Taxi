-- ============================================================================
-- /rates — server-rendered SEO body
-- ============================================================================
-- Adds the editorial copy that src/app/rates/page.tsx renders
-- *server-side*, below the client-side calculator and route list. The point of
-- the split is Googlebot: the calculator, search and route rows live in
-- RouteBrowser.tsx ('use client'), so this prose is what actually has to be in
-- the raw server HTML for the page to rank on anything but brand terms.
--
-- Isolated, additive and idempotent — it only ALTERs the existing
-- one_way_taxi_settings singleton created in
-- supabase/add_one_way_taxi_settings_and_route_destination_link.sql. No new
-- table, so no new RLS policy is needed: the table already has ENABLE ROW
-- LEVEL SECURITY plus a "Public read" SELECT policy, and writes still only
-- happen through the service-role client in /api/admin/one-way-taxi.
--
-- IMPORTANT: the page does NOT depend on this file having been run.
-- DEFAULT_ONE_WAY_TAXI_SETTINGS in src/lib/supabase/types.ts carries the same
-- copy as hardcoded literals, and src/lib/oneWayTaxi.ts
-- falls back to them when a column is missing, NULL, or blank. The seed below
-- exists so the admin has something real to edit, not so the page can render.
--
-- NOTE FOR WHOEVER ADDS THE ADMIN FORM: /api/admin/one-way-taxi whitelists the
-- columns it writes, and these two are deliberately NOT in that whitelist.
-- That is what keeps an existing admin save from blanking them (the upsert
-- only touches listed columns). Adding a column to the whitelist without also
-- adding its field to the admin form would send `?? ''` and wipe the value on
-- the next save — add the form field in the same change, or not at all.
-- Until then these are edited from the Supabase table editor, which bypasses
-- revalidateContent(), so a change takes up to CONTENT_CACHE_TTL to appear.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Columns
-- ----------------------------------------------------------------------------

ALTER TABLE one_way_taxi_settings
  ADD COLUMN IF NOT EXISTS seo_intro_heading TEXT NOT NULL DEFAULT '';

ALTER TABLE one_way_taxi_settings
  ADD COLUMN IF NOT EXISTS seo_intro_body TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN one_way_taxi_settings.seo_intro_heading IS
  'Heading for the server-rendered editorial block below the /rates route list.';

COMMENT ON COLUMN one_way_taxi_settings.seo_intro_body IS
  'Editorial body for /rates. Paragraphs are separated by a BLANK LINE; the '
  'page splits on /\n\s*\n/ and renders one <p> per chunk. Plain text only — '
  'it is not rendered as HTML.';

-- ----------------------------------------------------------------------------
-- Seed — only fills columns that are still blank, so re-running this file
-- never overwrites an admin edit. (The row itself already exists; this is an
-- UPDATE rather than the INSERT ... ON CONFLICT DO NOTHING used to create it.)
-- ----------------------------------------------------------------------------

UPDATE one_way_taxi_settings
SET
  seo_intro_heading = CASE
    WHEN COALESCE(NULLIF(TRIM(seo_intro_heading), ''), '') = ''
      THEN 'Taxi fares in Nainital and the Kumaon hills, explained'
    ELSE seo_intro_heading
  END,

  seo_intro_body = CASE
    WHEN COALESCE(NULLIF(TRIM(seo_intro_body), ''), '') = ''
      THEN
'Every fare on this page is a fixed point-to-point price, not a meter reading and not a per-kilometre estimate. You see the number before you book, and it is the number the driver collects. Fuel, the driver''s allowance and the vehicle''s commercial permit are inside it. Toll, parking and Uttarakhand state tax are charged at actuals on the day, because those are receipts we hand over rather than margin we keep.

The Kathgodam to Nainital run is the one most guests book first — a short climb of well-surfaced ghat road that is best driven in daylight. From Nainital, Bhimtal, Mukteshwar, Almora and Ranikhet are all comfortable single transfers. Kausani, Jim Corbett and the longer Delhi legs are full-day drives, so tell us your train or flight time and we will set the pick-up around it rather than the other way round.

Fares move with the calendar. Mid-March to June is peak season across Kumaon — every car in the valley is committed and drivers run longer days, so rates rise. July to February is off-season and noticeably cheaper. Set your travel date in the fare calculator above and it applies the correct season automatically, so you are never comparing a summer quote against a winter one by accident.

Choose the vehicle by luggage as much as by headcount. A Sedan carries four adults and two large bags comfortably. An SUV is the sensible choice for six on hill roads. The Innova Crysta gives the best ride quality on the Bhowali ghat, and the Premium SUV is what we send for airport pick-ups and long Delhi runs. Every car is a commercial-permit vehicle with a driver who has run these roads for years.'
    ELSE seo_intro_body
  END
WHERE id = '00000000-0000-0000-0000-000000000005';
