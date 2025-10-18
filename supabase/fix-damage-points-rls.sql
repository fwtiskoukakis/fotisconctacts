-- =====================================================
-- FIX DAMAGE POINTS RLS POLICIES
-- =====================================================
-- This script ensures damage_points are accessible to authenticated users

-- Enable RLS on damage_points (if not already enabled)
ALTER TABLE public.damage_points ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view damage points" ON public.damage_points;
DROP POLICY IF EXISTS "Users can view damage points for their contracts" ON public.damage_points;
DROP POLICY IF EXISTS "Users can insert damage points for their contracts" ON public.damage_points;
DROP POLICY IF EXISTS "Users can update damage points for their contracts" ON public.damage_points;
DROP POLICY IF EXISTS "Users can delete damage points for their contracts" ON public.damage_points;

-- Create new policies that allow authenticated users to access all damage points
-- (since damage points are linked to contracts, and contracts have their own RLS)

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

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'damage_points'
ORDER BY policyname;

