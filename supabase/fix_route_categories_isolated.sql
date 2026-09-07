-- ============================================================================
-- Fix: route_categories table/column/RLS/seed, isolated and idempotent.
-- ============================================================================
-- Paste into the Supabase SQL editor. Safe to run more than once.
--
-- Context (2026-09-07): /rates was showing "No routes available" while the
-- admin panel showed configured routes fine. getRoutesWithCategories()
-- (src/lib/supabase/queries_enhanced.ts) is the only data source for /rates
-- and depends on route_categories + routes.category_id, which are NOT part
-- of the core schema_enhanced.sql bootstrap — they're only created by
-- create_route_categories_schema.sql, normally applied as Step 2 of
-- RUN_ALL_MISSING_MIGRATIONS.sql. This file re-applies just that piece
-- (table, column, RLS policy, seed data) in isolation, without requiring a
-- full re-run of RUN_ALL_MISSING_MIGRATIONS.sql. See also the code-side
-- resilience fix in the same commit: getRoutesWithCategories() no longer
-- blanks out /rates if this table is ever missing/misconfigured again.
-- ============================================================================

-- 1. Table
CREATE TABLE IF NOT EXISTS route_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name VARCHAR(100) NOT NULL,
  category_slug VARCHAR(120) UNIQUE NOT NULL,
  category_description TEXT,
  icon VARCHAR(50) DEFAULT 'car',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Column on routes (guarded — no-op if already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'routes' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE routes ADD COLUMN category_id UUID REFERENCES route_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_routes_category_id ON routes(category_id);
CREATE INDEX IF NOT EXISTS idx_route_categories_display_order ON route_categories(display_order);

-- 3. updated_at trigger
CREATE OR REPLACE FUNCTION update_route_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS route_categories_updated_at_trigger ON route_categories;
CREATE TRIGGER route_categories_updated_at_trigger
  BEFORE UPDATE ON route_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_route_categories_updated_at();

-- 4. RLS — easy to miss even when the table exists, since in the original
-- migration bundle this policy lives in a different file
-- (RUN_ALL_MISSING_MIGRATIONS.sql) than the table definition. No `TO`
-- clause means this applies to PUBLIC (the anon key), per the RLS
-- convention documented in CLAUDE.md. Admin writes use the service-role
-- key (getAdminSupabaseClient()) and bypass RLS entirely, so this is
-- deliberately public-read-only — no write policy is added.
ALTER TABLE route_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON route_categories;
CREATE POLICY "Public read" ON route_categories FOR SELECT USING (is_active = true);

-- 5. Seed defaults (no-op if already present)
INSERT INTO route_categories (category_name, category_slug, category_description, icon, display_order)
VALUES
  ('Popular Destinations', 'popular-destinations', 'Most frequently booked routes from Nainital', 'mountain', 1),
  ('Hill Stations', 'hill-stations', 'Scenic hill station transfers', 'lake', 2),
  ('Temple Visits', 'temple-visits', 'Sacred temple pilgrimage routes', 'temple', 3),
  ('City Transfers', 'city-transfers', 'Railway station and airport transfers', 'city', 4),
  ('Weekend Getaways', 'weekend-getaways', 'Perfect for short trips', 'road', 5),
  ('Adventure Routes', 'adventure-routes', 'For thrill seekers and nature lovers', 'nature', 6)
ON CONFLICT (category_slug) DO NOTHING;

-- 6. Nudge PostgREST to pick up the new table/column/FK immediately rather
-- than waiting for its own periodic schema-cache refresh.
NOTIFY pgrst, 'reload schema';
