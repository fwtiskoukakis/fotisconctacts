-- =====================================================
-- FINAL RLS FIX - ALL TABLES
-- =====================================================
-- This script ensures all authenticated users can view data
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. CLEAN UP DUPLICATE POLICIES
-- =====================================================

-- Remove restrictive damage_points policies
DROP POLICY IF EXISTS "Users can view damage points of their contracts" ON public.damage_points;
DROP POLICY IF EXISTS "Users can delete damage points of their contracts" ON public.damage_points;
DROP POLICY IF EXISTS "Users can update damage points of their contracts" ON public.damage_points;

-- Remove any old contracts policies
DROP POLICY IF EXISTS "Users can view their contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can view own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can view contracts" ON public.contracts;

-- =====================================================
-- 2. CREATE CORRECT POLICIES
-- =====================================================

-- CARS: Everyone can view all cars
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view cars" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can view all cars" ON public.cars;
CREATE POLICY "Authenticated users can view all cars"
  ON public.cars
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- CONTRACTS: Everyone can view all contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view all contracts" ON public.contracts;
CREATE POLICY "Authenticated users can view all contracts"
  ON public.contracts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- CONTRACTS: Users can insert their own contracts
DROP POLICY IF EXISTS "Users can insert contracts" ON public.contracts;
CREATE POLICY "Users can insert contracts"
  ON public.contracts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- CONTRACTS: Users can update their own contracts
DROP POLICY IF EXISTS "Users can update own contracts" ON public.contracts;
CREATE POLICY "Users can update own contracts"
  ON public.contracts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- CONTRACTS: Users can delete their own contracts
DROP POLICY IF EXISTS "Users can delete own contracts" ON public.contracts;
CREATE POLICY "Users can delete own contracts"
  ON public.contracts
  FOR DELETE
  USING (auth.uid() = user_id);

-- DAMAGE POINTS: Everyone can view all damage points
ALTER TABLE public.damage_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view all damage points" ON public.damage_points;
CREATE POLICY "Authenticated users can view all damage points"
  ON public.damage_points
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- DAMAGE POINTS: Users can insert damage points
DROP POLICY IF EXISTS "Authenticated users can insert damage points" ON public.damage_points;
CREATE POLICY "Authenticated users can insert damage points"
  ON public.damage_points
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- DAMAGE POINTS: Users can update damage points for their contracts
DROP POLICY IF EXISTS "Users can update damage points for own contracts" ON public.damage_points;
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

-- DAMAGE POINTS: Users can delete damage points for their contracts
DROP POLICY IF EXISTS "Users can delete damage points for own contracts" ON public.damage_points;
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

-- USERS: Everyone can view all user profiles
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "Users can view all profiles"
  ON public.users
  FOR SELECT
  USING (true);

-- USERS: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- 3. VERIFY POLICIES
-- =====================================================

-- Check contracts policies
SELECT 
  'contracts' as table_name,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' AND qual LIKE '%authenticated%' THEN '✅ View all'
    WHEN cmd = 'INSERT' THEN '✅ Create own'
    WHEN cmd = 'UPDATE' THEN '✅ Update own'
    WHEN cmd = 'DELETE' THEN '✅ Delete own'
  END as policy_type
FROM pg_policies
WHERE tablename = 'contracts'
ORDER BY cmd, policyname;

-- Check damage_points policies
SELECT 
  'damage_points' as table_name,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' AND qual LIKE '%authenticated%' THEN '✅ View all'
    WHEN cmd = 'INSERT' THEN '✅ Create'
    WHEN cmd = 'UPDATE' THEN '✅ Update own'
    WHEN cmd = 'DELETE' THEN '✅ Delete own'
  END as policy_type
FROM pg_policies
WHERE tablename = 'damage_points'
ORDER BY cmd, policyname;

-- =====================================================
-- 4. TEST QUERIES
-- =====================================================

-- Test contracts query
SELECT 
  'contracts' as test_name,
  COUNT(*) as total_count
FROM public.contracts;

-- Test contracts with details
SELECT 
  id,
  renter_full_name,
  car_license_plate,
  car_make_model,
  pickup_date,
  dropoff_date,
  total_cost,
  created_at
FROM public.contracts
ORDER BY created_at DESC
LIMIT 5;

-- Test damage_points query
SELECT 
  'damage_points' as test_name,
  COUNT(*) as total_count
FROM public.damage_points;

-- Test damage_points with join
SELECT 
  dp.id,
  dp.description,
  dp.severity,
  c.renter_full_name,
  c.car_license_plate
FROM public.damage_points dp
JOIN public.contracts c ON dp.contract_id = c.id
ORDER BY dp.created_at DESC
LIMIT 5;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT '✅ RLS policies updated successfully!' as status;

