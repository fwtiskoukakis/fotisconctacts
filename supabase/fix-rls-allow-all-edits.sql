-- ================================================================
-- FIX RLS POLICIES: ALLOW ALL EDITS, RESTRICT ONLY DELETE
-- ================================================================
-- This updates the RLS policies so that:
-- 1. All authenticated users can view all contracts ✅
-- 2. All authenticated users can create contracts ✅
-- 3. All authenticated users can EDIT any contract ✅ (NEW!)
-- 4. Only owners can DELETE their own contracts ✅

-- ================================================================
-- CONTRACTS TABLE - UPDATE POLICIES
-- ================================================================

-- Drop the old restrictive update policy
DROP POLICY IF EXISTS "Users can update own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can update their own contracts" ON public.contracts;

-- Create new policy that allows all authenticated users to update any contract
CREATE POLICY "Authenticated users can update all contracts"
  ON public.contracts
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Verify DELETE policy is still restrictive (only owners can delete)
DROP POLICY IF EXISTS "Users can delete own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can delete their own contracts" ON public.contracts;

CREATE POLICY "Users can delete own contracts"
  ON public.contracts
  FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- VERIFY POLICIES
-- ================================================================

-- Show current policies for contracts table
SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Anyone can view'
    WHEN cmd = 'INSERT' THEN '✅ Anyone can create'
    WHEN cmd = 'UPDATE' AND qual LIKE '%authenticated%' THEN '✅ Anyone can edit'
    WHEN cmd = 'DELETE' AND qual LIKE '%user_id%' THEN '✅ Only owner can delete'
    ELSE '⚠️ Check this policy'
  END as "Status"
FROM pg_policies
WHERE tablename = 'contracts'
ORDER BY cmd, policyname;

