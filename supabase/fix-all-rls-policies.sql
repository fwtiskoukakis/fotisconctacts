-- =====================================================
-- FIX ALL RLS POLICIES FOR CAR RENTAL APP
-- =====================================================
-- Run this script to ensure all tables are accessible

-- =====================================================
-- CARS TABLE - Allow all authenticated users to view
-- =====================================================
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view cars" ON public.cars;
DROP POLICY IF EXISTS "Users can view all cars" ON public.cars;

CREATE POLICY "Authenticated users can view all cars"
  ON public.cars
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- =====================================================
-- CONTRACTS TABLE - Allow all authenticated users
-- =====================================================
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can update own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can delete own contracts" ON public.contracts;

-- Allow all authenticated users to view all contracts
CREATE POLICY "Authenticated users can view all contracts"
  ON public.contracts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow all authenticated users to insert contracts
CREATE POLICY "Authenticated users can insert contracts"
  ON public.contracts
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own contracts
CREATE POLICY "Users can update own contracts"
  ON public.contracts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own contracts
CREATE POLICY "Users can delete own contracts"
  ON public.contracts
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- DAMAGE POINTS TABLE - Allow all authenticated users
-- =====================================================
ALTER TABLE public.damage_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view damage points" ON public.damage_points;
DROP POLICY IF EXISTS "Authenticated users can view all damage points" ON public.damage_points;
DROP POLICY IF EXISTS "Authenticated users can insert damage points" ON public.damage_points;
DROP POLICY IF EXISTS "Users can update damage points for own contracts" ON public.damage_points;
DROP POLICY IF EXISTS "Users can delete damage points for own contracts" ON public.damage_points;

-- Allow all authenticated users to view all damage points
CREATE POLICY "Authenticated users can view all damage points"
  ON public.damage_points
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert damage points
CREATE POLICY "Authenticated users can insert damage points"
  ON public.damage_points
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update damage points for contracts they own
CREATE POLICY "Users can update damage points for own contracts"
  ON public.damage_points
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = damage_points.contract_id
      AND contracts.user_id = auth.uid()
    )
  );

-- Allow users to delete damage points for contracts they own
CREATE POLICY "Users can delete damage points for own contracts"
  ON public.damage_points
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = damage_points.contract_id
      AND contracts.user_id = auth.uid()
    )
  );

-- =====================================================
-- USERS TABLE - Allow users to manage their own profile
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Users can read all user profiles
CREATE POLICY "Users can view all profiles"
  ON public.users
  FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- VERIFY ALL POLICIES
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('cars', 'contracts', 'damage_points', 'users')
ORDER BY tablename, policyname;

-- =====================================================
-- TEST QUERIES (Run these to verify access)
-- =====================================================
-- These should all return data without errors:

-- Test cars access
SELECT COUNT(*) as cars_count FROM public.cars;

-- Test contracts access
SELECT COUNT(*) as contracts_count FROM public.contracts;

-- Test damage points access
SELECT COUNT(*) as damages_count FROM public.damage_points;

-- Test damage points with contracts join
SELECT 
  dp.id,
  dp.description,
  dp.severity,
  c.renter_full_name,
  c.car_license_plate
FROM public.damage_points dp
JOIN public.contracts c ON dp.contract_id = c.id
LIMIT 5;

-- If any of these fail, there's still an RLS issue

