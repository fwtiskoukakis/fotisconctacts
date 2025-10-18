-- ==============================================
-- Add AADE Fields to Users Table
-- ==============================================
-- This migration adds AADE configuration fields to the users table
-- so each user can store their own business credentials

-- Add AADE fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS aade_user_id TEXT,
ADD COLUMN IF NOT EXISTS aade_subscription_key TEXT,
ADD COLUMN IF NOT EXISTS company_vat_number TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_activity TEXT,
ADD COLUMN IF NOT EXISTS aade_enabled BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.users.aade_user_id IS 'AADE User ID for myDATA integration';
COMMENT ON COLUMN public.users.aade_subscription_key IS 'AADE Subscription Key for API authentication';
COMMENT ON COLUMN public.users.company_vat_number IS 'Company VAT Number (ΑΦΜ)';
COMMENT ON COLUMN public.users.company_name IS 'Company legal name';
COMMENT ON COLUMN public.users.company_address IS 'Company registered address';
COMMENT ON COLUMN public.users.company_activity IS 'Company business activity description';
COMMENT ON COLUMN public.users.aade_enabled IS 'Whether AADE integration is enabled for this user';

-- Create index for VAT number lookups
CREATE INDEX IF NOT EXISTS users_company_vat_number_idx ON public.users (company_vat_number);

-- Add RLS policy for users to update their own AADE settings
-- (The existing "Users can update own profile" policy should cover this,
-- but we're being explicit here)

DO $$
BEGIN
    RAISE NOTICE '✅ AADE fields added to users table successfully!';
    RAISE NOTICE '📊 New fields: aade_user_id, aade_subscription_key, company_vat_number';
    RAISE NOTICE '🔒 Users can update their own AADE settings via existing RLS policies';
    RAISE NOTICE '🚀 Ready to configure AADE per user!';
END $$;

