-- ==============================================
-- Add Missing Profile Columns to Users Table
-- ==============================================
-- Adds phone, address, avatar_url, is_active, and email columns

-- Add missing profile fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.users.phone IS 'User phone number';
COMMENT ON COLUMN public.users.address IS 'User physical address';
COMMENT ON COLUMN public.users.avatar_url IS 'URL to user avatar image in storage';
COMMENT ON COLUMN public.users.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN public.users.email IS 'User email (cached from auth.users)';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS users_phone_idx ON public.users (phone);
CREATE INDEX IF NOT EXISTS users_is_active_idx ON public.users (is_active);
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Missing profile columns added successfully!';
    RAISE NOTICE '📊 New columns: phone, address, avatar_url, is_active, email';
    RAISE NOTICE '🚀 Profile page should now work correctly!';
END $$;

