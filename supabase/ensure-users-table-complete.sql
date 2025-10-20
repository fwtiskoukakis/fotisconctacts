-- ==============================================
-- COMPREHENSIVE USERS TABLE MIGRATION
-- Ensures ALL fields needed for profile sync exist
-- ==============================================

-- Ensure users table exists (it should be created by Supabase Auth)
-- But we'll add all our custom fields

-- Basic Profile Fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS signature_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- AADE Integration Fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS aade_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS aade_username TEXT,
ADD COLUMN IF NOT EXISTS aade_subscription_key TEXT,
ADD COLUMN IF NOT EXISTS company_vat_number TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_activity TEXT;

-- Metadata Fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);
CREATE INDEX IF NOT EXISTS users_phone_idx ON public.users (phone);
CREATE INDEX IF NOT EXISTS users_company_vat_number_idx ON public.users (company_vat_number);
CREATE INDEX IF NOT EXISTS users_is_active_idx ON public.users (is_active);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON public.users (created_at);

-- Add column comments for documentation
COMMENT ON COLUMN public.users.name IS 'User full name';
COMMENT ON COLUMN public.users.phone IS 'User phone number';
COMMENT ON COLUMN public.users.address IS 'User physical address';
COMMENT ON COLUMN public.users.signature_url IS 'URL to user signature image for contracts';
COMMENT ON COLUMN public.users.avatar_url IS 'URL to user avatar/profile image';
COMMENT ON COLUMN public.users.email IS 'User email address';
COMMENT ON COLUMN public.users.aade_enabled IS 'Whether AADE integration is enabled';
COMMENT ON COLUMN public.users.aade_username IS 'AADE username for authentication';
COMMENT ON COLUMN public.users.aade_subscription_key IS 'AADE API subscription key';
COMMENT ON COLUMN public.users.company_vat_number IS 'Company VAT Number (ΑΦΜ)';
COMMENT ON COLUMN public.users.company_name IS 'Company legal name';
COMMENT ON COLUMN public.users.company_address IS 'Company registered address';
COMMENT ON COLUMN public.users.company_activity IS 'Company business activity';
COMMENT ON COLUMN public.users.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN public.users.created_at IS 'Timestamp when user was created';
COMMENT ON COLUMN public.users.updated_at IS 'Timestamp of last update';

-- Create or replace update trigger for updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at_trigger ON public.users;
CREATE TRIGGER update_users_updated_at_trigger
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- Ensure RLS policies are set up correctly
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile (for initial setup)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Verification
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    -- Count the columns we added
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name IN (
        'name', 'phone', 'address', 'signature_url', 'avatar_url', 'email',
        'aade_enabled', 'aade_username', 'aade_subscription_key',
        'company_vat_number', 'company_name', 'company_address', 'company_activity',
        'is_active', 'created_at', 'updated_at'
    );
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ Users table migration completed!';
    RAISE NOTICE '📊 Found % out of 16 expected columns', column_count;
    RAISE NOTICE '🔒 RLS policies updated';
    RAISE NOTICE '⚡ Indexes created for performance';
    RAISE NOTICE '🔄 Updated_at trigger configured';
    RAISE NOTICE '🚀 Profile page ready for full Supabase sync!';
    RAISE NOTICE '============================================';
    
    IF column_count < 16 THEN
        RAISE WARNING '⚠️  Some columns may be missing. Expected 16, found %', column_count;
    END IF;
END $$;

