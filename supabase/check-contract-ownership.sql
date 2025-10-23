-- Check ownership and details of a specific contract
-- Replace the contract ID with the one you're trying to delete

SELECT 
  id,
  user_id,
  renter_full_name,
  car_license_plate,
  created_at,
  CASE 
    WHEN user_id = auth.uid() THEN '✅ YOU OWN THIS - Can delete'
    ELSE '❌ OWNED BY ANOTHER USER - Cannot delete'
  END as ownership_status
FROM public.contracts
WHERE id = '601ad6bd-a803-409e-984b-997c9a6b72d8';

-- Also show your current user ID for reference
SELECT 
  'Your User ID:' as label,
  auth.uid() as value;

-- Show all users to see who owns this contract
SELECT 
  u.id,
  u.name,
  u.email,
  COUNT(c.id) as contract_count,
  CASE 
    WHEN u.id = auth.uid() THEN '👤 YOU'
    ELSE ''
  END as is_you
FROM public.users u
LEFT JOIN public.contracts c ON c.user_id = u.id
GROUP BY u.id, u.name, u.email
ORDER BY contract_count DESC;

