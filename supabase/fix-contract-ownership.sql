-- ================================================================
-- FIX CONTRACT OWNERSHIP OR ALLOW DELETION
-- ================================================================
-- Use this to either take ownership of a contract or force delete it
-- Run in Supabase SQL Editor

-- ================================================================
-- OPTION 1: Transfer ownership to your current user
-- ================================================================
-- This will make you the owner so you can delete it normally
UPDATE public.contracts
SET user_id = auth.uid()
WHERE id = '601ad6bd-a803-409e-984b-997c9a6b72d8';

-- Verify the change
SELECT 
  id,
  user_id,
  renter_full_name,
  'Ownership updated!' as status
FROM public.contracts
WHERE id = '601ad6bd-a803-409e-984b-997c9a6b72d8';

-- ================================================================
-- OPTION 2: Temporarily allow all authenticated users to delete any contract
-- ================================================================
-- WARNING: This removes protection, use only temporarily!
-- DROP POLICY IF EXISTS "Authenticated users can delete any contract" ON public.contracts;
-- CREATE POLICY "Authenticated users can delete any contract"
--   ON public.contracts
--   FOR DELETE
--   USING (auth.role() = 'authenticated');

-- After deleting, restore the original policy:
-- DROP POLICY IF EXISTS "Authenticated users can delete any contract" ON public.contracts;
-- CREATE POLICY "Users can delete own contracts"
--   ON public.contracts
--   FOR DELETE
--   USING (auth.uid() = user_id);

-- ================================================================
-- OPTION 3: Direct delete (requires service_role or bypassing RLS)
-- ================================================================
-- This requires admin/service role permissions
-- Only use if you're logged in as a Supabase admin

-- First delete related damage points
-- DELETE FROM public.damage_points
-- WHERE contract_id = '601ad6bd-a803-409e-984b-997c9a6b72d8';

-- Then delete contract photos
-- DELETE FROM public.contract_photos
-- WHERE contract_id = '601ad6bd-a803-409e-984b-997c9a6b72d8';

-- Finally delete the contract
-- DELETE FROM public.contracts
-- WHERE id = '601ad6bd-a803-409e-984b-997c9a6b72d8';

