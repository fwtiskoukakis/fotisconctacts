-- =====================================================
-- QUICK FIX: Enable Data Viewing for All Tables
-- =====================================================
-- Run this in Supabase SQL Editor
-- This script is safe to run multiple times

-- =====================================================
-- STEP 1: Remove old/duplicate policies
-- =====================================================

-- Clean up contracts policies
DROP POLICY IF EXISTS "Users can view their contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can view own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can view all contracts" ON public.contracts;

-- Clean up damage_points policies
DROP POLICY IF EXISTS "Users can view damage points of their contracts" ON public.damage_points;
DROP POLICY IF EXISTS "Authenticated users can view all damage points" ON public.damage_points;

-- Clean up cars policies
DROP POLICY IF EXISTS "Authenticated users can view cars" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can view all cars" ON public.cars;

-- =====================================================
-- STEP 2: Create new policies (simple and clear)
-- =====================================================

-- CONTRACTS: Allow viewing all contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_all_contracts"
  ON public.contracts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- DAMAGE POINTS: Allow viewing all damage points
ALTER TABLE public.damage_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_all_damage_points"
  ON public.damage_points
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- CARS: Allow viewing all cars
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_all_cars"
  ON public.cars
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- USERS: Allow viewing all users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "view_all_users"
  ON public.users
  FOR SELECT
  USING (true);

-- =====================================================
-- STEP 3: Test queries
-- =====================================================

-- Test contracts
SELECT 
  'CONTRACTS' as table_name,
  COUNT(*) as total_rows,
  '✅ Should see all contracts' as status
FROM public.contracts;

-- Test damage points
SELECT 
  'DAMAGE_POINTS' as table_name,
  COUNT(*) as total_rows,
  '✅ Should see all damage points' as status
FROM public.damage_points;

-- Test cars
SELECT 
  'CARS' as table_name,
  COUNT(*) as total_rows,
  '✅ Should see all cars' as status
FROM public.cars;

-- Test users
SELECT 
  'USERS' as table_name,
  COUNT(*) as total_rows,
  '✅ Should see all users' as status
FROM public.users;

-- Test damage points with contract join (what the app does)
SELECT 
  'DAMAGE_POINTS_WITH_CONTRACTS' as test_name,
  COUNT(*) as total_rows,
  '✅ Should see damages with renter names' as status
FROM public.damage_points dp
JOIN public.contracts c ON dp.contract_id = c.id;

-- Show sample data
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
-- SUCCESS!
-- =====================================================
SELECT '✅ RLS policies fixed! Refresh your app now.' as result;

