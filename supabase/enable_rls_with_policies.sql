-- ============================================================================
-- ENABLE RLS WITH PUBLIC READ POLICIES
-- This allows anonymous users to read data but not modify it
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

-- Create policies for PUBLIC READ access

-- Vehicles: Anyone can view active vehicles
DROP POLICY IF EXISTS "Public can view active vehicles" ON vehicles;
CREATE POLICY "Public can view active vehicles"
ON vehicles FOR SELECT
TO public
USING (true);

-- Packages: Anyone can view active packages
DROP POLICY IF EXISTS "Public can view packages" ON packages;
CREATE POLICY "Public can view packages"
ON packages FOR SELECT
TO public
USING (true);

-- Seasons: Anyone can view seasons
DROP POLICY IF EXISTS "Public can view seasons" ON seasons;
CREATE POLICY "Public can view seasons"
ON seasons FOR SELECT
TO public
USING (true);

-- Pricing: Anyone can view pricing
DROP POLICY IF EXISTS "Public can view pricing" ON pricing;
CREATE POLICY "Public can view pricing"
ON pricing FOR SELECT
TO public
USING (true);

-- Verify policies are created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('vehicles', 'packages', 'seasons', 'pricing')
ORDER BY tablename, policyname;
