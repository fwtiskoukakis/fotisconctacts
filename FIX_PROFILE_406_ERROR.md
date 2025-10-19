# Fix Profile 406 Error

## Problem
Getting a 406 error when trying to load user profile data from Supabase.

## Root Cause
The `users` table in your Supabase database is missing some required columns that the profile page is trying to fetch.

## Solution

### Step 1: Run Database Migration

Go to your Supabase project dashboard:

1. Open Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **"New Query"**
5. Copy and paste the contents of `supabase/update-users-table-complete.sql`
6. Click **"Run"**

The migration will add all necessary columns to your `users` table:
- `phone` - User phone number
- `address` - User address  
- `avatar_url` - User avatar
- `aade_enabled` - AADE integration toggle
- `aade_user_id` - AADE User ID
- `aade_subscription_key` - AADE API key
- `company_vat_number` - Company VAT (ΑΦΜ)
- `company_name` - Company name
- `company_address` - Company address
- `company_activity` - Business activity
- `is_active` - Account status

### Step 2: Verify

After running the migration:

1. Refresh your app
2. Navigate to the Profile page
3. The 406 error should be gone!

## Fallback

If you still get errors, the code now includes a fallback that will:
1. Try to fetch all columns first
2. If it fails, fall back to basic columns (name, signature_url)
3. Display whatever data is available

## Alternative: Run via Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push supabase/update-users-table-complete.sql
```

## What Changed

### `services/auth.service.ts`
- Changed from `.single()` to `.maybeSingle()` (safer for missing data)
- Added explicit column list instead of `SELECT *`
- Added fallback for missing columns
- Better error handling

### `components/app-header.tsx`
- Now loads actual user data from database
- Displays correct name and avatar
- All menu items are functional

### `app/profile.tsx`
- Complete redesign with modern UI
- Editable fields that save to database
- Better error handling for missing data

## Questions?

If you still experience issues:
1. Check Supabase logs for detailed errors
2. Verify RLS policies allow reading user profiles
3. Check that your Supabase connection is configured correctly in `utils/supabase.ts`

