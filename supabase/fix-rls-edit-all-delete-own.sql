-- =====================================================
-- FIX RLS: Allow ALL to edit, but only OWNER can delete
-- =====================================================
-- This allows any authenticated user to edit any contract
-- But only the owner can delete their own contracts

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can update own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can update contracts" ON public.contracts;

-- Allow ALL authenticated users to update ANY contract
CREATE POLICY "Authenticated users can update all contracts"
  ON public.contracts
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Keep delete restricted to owner only
DROP POLICY IF EXISTS "Users can delete own contracts" ON public.contracts;
CREATE POLICY "Users can delete own contracts"
  ON public.contracts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Verify policies
SELECT 
  'contracts' as table_name,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ View all'
    WHEN cmd = 'INSERT' THEN '✅ Create'
    WHEN cmd = 'UPDATE' THEN '✅ Edit all contracts'
    WHEN cmd = 'DELETE' THEN '✅ Delete own only'
  END as description
FROM pg_policies
WHERE tablename = 'contracts'
ORDER BY cmd, policyname;

