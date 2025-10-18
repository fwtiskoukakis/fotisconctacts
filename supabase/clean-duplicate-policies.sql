-- =====================================================
-- CLEAN UP DUPLICATE RLS POLICIES
-- =====================================================
-- You have duplicate policies that might be conflicting
-- This script removes duplicates and keeps only the correct ones

-- =====================================================
-- DAMAGE POINTS - Remove duplicates
-- =====================================================

-- Drop the OLD restrictive policies (these only show user's own damages)
DROP POLICY IF EXISTS "Users can view damage points of their contracts" ON public.damage_points;

-- Drop duplicate delete policy
DROP POLICY IF EXISTS "Users can delete damage points of their contracts" ON public.damage_points;

-- Drop duplicate update policy  
DROP POLICY IF EXISTS "Users can update damage points of their contracts" ON public.damage_points;

-- Keep these policies:
-- ✅ "Authenticated users can view all damage points" - allows viewing ALL damages
-- ✅ "Authenticated users can insert damage points" - allows creating damages
-- ✅ "Users can update damage points for own contracts" - allows updating own
-- ✅ "Users can delete damage points for own contracts" - allows deleting own

-- Verify final policies
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' AND qual LIKE '%auth.role()%' THEN '✅ Allows viewing ALL'
    WHEN cmd = 'SELECT' AND qual LIKE '%user_id%' THEN '❌ Restricts to own only'
    WHEN cmd = 'INSERT' THEN '✅ Allows creating'
    WHEN cmd = 'UPDATE' THEN '✅ Allows updating own'
    WHEN cmd = 'DELETE' THEN '✅ Allows deleting own'
  END as policy_type
FROM pg_policies
WHERE tablename = 'damage_points'
ORDER BY cmd, policyname;

-- Test query - should return ALL 16 damages
SELECT COUNT(*) as total_damages FROM public.damage_points;

-- Test with join - should return damage details
SELECT 
  dp.id,
  dp.description,
  dp.severity,
  c.renter_full_name,
  c.car_license_plate
FROM public.damage_points dp
JOIN public.contracts c ON dp.contract_id = c.id
ORDER BY dp.created_at DESC
LIMIT 10;

