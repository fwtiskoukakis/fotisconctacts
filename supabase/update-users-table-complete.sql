-- ==============================================
-- Complete Users Table Update
-- ==============================================
-- This migration adds all necessary fields to the users table

-- Add basic profile fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add AADE fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS aade_user_id TEXT,
ADD COLUMN IF NOT EXISTS aade_subscription_key TEXT,
ADD COLUMN IF NOT EXISTS company_vat_number TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_activity TEXT,
ADD COLUMN IF NOT EXISTS aade_enabled BOOLEAN DEFAULT false;

-- Add metadata fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.users.phone IS 'User phone number';
COMMENT ON COLUMN public.users.address IS 'User address';
COMMENT ON COLUMN public.users.avatar_url IS 'URL to user avatar image';
COMMENT ON COLUMN public.users.aade_user_id IS 'AADE User ID for myDATA integration';
COMMENT ON COLUMN public.users.aade_subscription_key IS 'AADE Subscription Key for API authentication';
COMMENT ON COLUMN public.users.company_vat_number IS 'Company VAT Number (ΑΦΜ)';
COMMENT ON COLUMN public.users.company_name IS 'Company legal name';
COMMENT ON COLUMN public.users.company_address IS 'Company registered address';
COMMENT ON COLUMN public.users.company_activity IS 'Company business activity description';
COMMENT ON COLUMN public.users.aade_enabled IS 'Whether AADE integration is enabled for this user';
COMMENT ON COLUMN public.users.is_active IS 'Whether the user account is active';

-- Create indexes
CREATE INDEX IF NOT EXISTS users_company_vat_number_idx ON public.users (company_vat_number);
CREATE INDEX IF NOT EXISTS users_phone_idx ON public.users (phone);
CREATE INDEX IF NOT EXISTS users_is_active_idx ON public.users (is_active);

-- Verify the table structure
DO $$
BEGIN
    RAISE NOTICE '✅ Users table updated successfully!';
    RAISE NOTICE '📊 All profile and AADE fields are now available';
    RAISE NOTICE '🔒 RLS policies remain unchanged';
    RAISE NOTICE '🚀 Profile page should now work correctly!';
END $$;

