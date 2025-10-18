
# Supabase Migration Guide

## Overview
This guide will help you migrate your car rental contract app from local file storage to Supabase.

## Prerequisites
- Node.js and npm installed
- Expo CLI installed
- Supabase account created
- Supabase project created

## Step 1: Environment Setup

1. Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=https://kwjtqsomuwdotfkrqbne.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3anRxc29tdXdkb3Rma3JxYm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MzE1NTEsImV4cCI6MjA3NjMwNzU1MX0.GmhiN9-zwnNqsJsK7VoSvJxPW-G8acSOSazIHCCpB88
```

2. Restart your Expo development server:
```bash
npm start
```

## Step 2: Create Database Schema

### Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase/schema.sql`
5. Click **Run** to execute the SQL

### Using Supabase CLI (Alternative)

If you have the Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref kwjtqsomuwdotfkrqbne

# Run migrations
supabase db push
```

## Step 3: Create Storage Buckets

### Using Supabase Dashboard

1. Navigate to **Storage** in the left sidebar
2. Click **Create Bucket**
3. Create two buckets:
   - **contract-photos** (Public)
     - Name: `contract-photos`
     - Public: ✓ Yes
     - File size limit: 10 MB
     - Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp
   
   - **signatures** (Private)
     - Name: `signatures`
     - Public: ✗ No
     - File size limit: 2 MB
     - Allowed MIME types: image/png, image/svg+xml, image/jpeg

4. After creating buckets, run the storage policies:
   - Navigate to **SQL Editor**
   - Copy and paste the contents of `supabase/storage-setup.sql`
   - Click **Run**

### Using SQL Editor

Alternatively, you can create buckets using SQL:

1. Navigate to **SQL Editor**
2. Copy and paste the contents of `supabase/storage-setup.sql`
3. Click **Run**

## Step 4: Set Up Authentication

### Configure Email Auth

1. Navigate to **Authentication** → **Providers** in Supabase dashboard
2. Enable **Email** provider
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize the signup and password reset emails

### Disable Email Confirmation (For Development)

For easier development, you can disable email confirmation:

1. Go to **Authentication** → **Settings**
2. Find **Email Confirmation**
3. Toggle **Enable email confirmations** to OFF

**⚠️ Important:** Enable this before going to production!

## Step 5: Create Your First User

### Option A: Using the App

Once you integrate the authentication service in your app, users can sign up directly.

### Option B: Using Supabase Dashboard

1. Navigate to **Authentication** → **Users**
2. Click **Add User**
3. Enter email and password
4. The user profile will be automatically created via triggers

### Option C: Using SQL

```sql
-- Insert a user directly (for testing)
-- Note: This bypasses Supabase auth and is NOT recommended for production
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now()
);
```

## Step 6: Migrate Existing Data (Optional)

If you have existing contracts in local storage, you'll need to migrate them.

### Create Migration Script

```typescript
// scripts/migrate-to-supabase.ts
import { ContractStorageService } from '../services/contract-storage.service';
import { SupabaseContractService } from '../services/supabase-contract.service';

async function migrateContracts() {
  console.log('Starting migration...');
  
  // Get all contracts from local storage
  const contracts = await ContractStorageService.getAllContracts();
  console.log(`Found ${contracts.length} contracts to migrate`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const contract of contracts) {
    try {
      // Save to Supabase
      const result = await SupabaseContractService.saveContract({
        contract,
        photoFiles: [], // Photos need special handling
      });
      
      if (result.error) {
        console.error(`Error migrating contract ${contract.id}:`, result.error);
        errorCount++;
      } else {
        console.log(`Successfully migrated contract ${contract.id}`);
        successCount++;
      }
    } catch (error) {
      console.error(`Error migrating contract ${contract.id}:`, error);
      errorCount++;
    }
  }
  
  console.log(`Migration complete: ${successCount} success, ${errorCount} errors`);
}

// Run migration
migrateContracts();
```

## Step 7: Update Your App Code

### Replace Storage Service

Update your components to use `SupabaseContractService` instead of `ContractStorageService`:

**Before:**
```typescript
import { ContractStorageService } from '../services/contract-storage.service';

const contracts = await ContractStorageService.getAllContracts();
```

**After:**
```typescript
import { SupabaseContractService } from '../services/supabase-contract.service';

const contracts = await SupabaseContractService.getAllContracts();
```

### Add Authentication

Add authentication to your app:

```typescript
import { AuthService } from '../services/auth.service';

// Sign in
const { user, error } = await AuthService.signIn({
  email: 'user@example.com',
  password: 'password123',
});

// Get current user
const currentUser = await AuthService.getCurrentUser();
```

## Step 8: Test Your Integration

### Test Checklist

- [ ] Can create a new user account
- [ ] Can sign in with email and password
- [ ] Can create a new contract
- [ ] Can upload contract photos
- [ ] Can view all contracts
- [ ] Can view a specific contract
- [ ] Can search contracts
- [ ] Can delete a contract
- [ ] Photos are displayed correctly
- [ ] Signatures are saved and displayed
- [ ] Damage points are saved correctly

## Step 9: Update App Navigation

Add authentication screens to your app:

1. Create a sign-in screen
2. Create a sign-up screen
3. Add authentication check to your main screens
4. Implement automatic session restoration

## Step 10: Deploy

### Update Environment Variables

For production deployment:

1. Create `.env.production`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://kwjtqsomuwdotfkrqbne.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

2. Configure EAS Build with environment variables

### Enable Security Features

Before going to production:

1. **Enable email confirmation** in Supabase auth settings
2. **Review RLS policies** to ensure data security
3. **Set up backup** for your database
4. **Configure rate limiting** for auth endpoints
5. **Review storage bucket policies**

## Troubleshooting

### Common Issues

**Issue: "Invalid API key"**
- Check that your `.env` file has the correct Supabase URL and anon key
- Restart your Expo development server after creating/updating `.env`

**Issue: "Row Level Security policy violation"**
- Ensure you're authenticated before making requests
- Check that RLS policies are correctly set up
- Verify that the user has the correct permissions

**Issue: "Storage upload failed"**
- Check that storage buckets are created
- Verify storage policies are set up correctly
- Ensure file size is within limits

**Issue: "Authentication error"**
- Check email confirmation settings
- Verify user exists in the database
- Check that password meets requirements

## Best Practices

1. **Always use RLS policies** - Never disable Row Level Security
2. **Use storage policies** - Protect user data with proper storage policies
3. **Validate input** - Always validate user input before saving to database
4. **Handle errors gracefully** - Provide clear error messages to users
5. **Use transactions** - For complex operations, use database transactions
6. **Optimize queries** - Use select only the columns you need
7. **Index properly** - Ensure database indexes are in place for better performance

## Next Steps

- Set up real-time subscriptions for live updates
- Add file compression for photos before upload
- Implement offline support with local caching
- Add analytics and monitoring
- Set up automated backups

## Support

- Supabase Documentation: https://supabase.com/docs
- React Native Guide: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
- Community Support: https://github.com/supabase/supabase/discussions

