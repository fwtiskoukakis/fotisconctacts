# 🚀 Quick Setup Guide

## TL;DR - Get Started in 5 Minutes

### Step 1: Environment Variables (1 min)
Create `.env` in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=https://kwjtqsomuwdotfkrqbne.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3anRxc29tdXdkb3Rma3JxYm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MzE1NTEsImV4cCI6MjA3NjMwNzU1MX0.GmhiN9-zwnNqsJsK7VoSvJxPW-G8acSOSazIHCCpB88
```

### Step 2: Create Database Schema (2 min)
1. Go to: https://supabase.com/dashboard/project/kwjtqsomuwdotfkrqbne/sql/new
2. Copy all content from `supabase/schema.sql`
3. Paste and click **Run**

### Step 3: Create Storage Buckets (2 min)
1. Still in SQL Editor
2. Copy all content from `supabase/storage-setup.sql`
3. Paste and click **Run**

✅ **Done!** Your database and storage are ready.

## Create Your First User

### Option 1: Via Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/kwjtqsomuwdotfkrqbne/auth/users
2. Click **Add User** → **Create new user**
3. Enter email and password
4. Click **Create user**

### Option 2: Via App (After implementing auth screens)
```typescript
import { AuthService } from './services/auth.service';

const { user, error } = await AuthService.signUp({
  email: 'admin@example.com',
  password: 'SecurePass123!',
  name: 'Διαχειριστής',
});
```

## Test Your Setup

```typescript
import { supabase } from './utils/supabase';

// Test connection
const { data, error } = await supabase
  .from('users')
  .select('*')
  .limit(1);

if (error) {
  console.error('Error:', error);
} else {
  console.log('✅ Connected to Supabase!');
}
```

## Next Steps

1. **Disable email confirmation** (for development):
   - Go to: https://supabase.com/dashboard/project/kwjtqsomuwdotfkrqbne/auth/providers
   - Scroll to Email Settings
   - Turn OFF "Enable email confirmations"

2. **Create a test contract**:
   ```typescript
   import { SupabaseContractService } from './services/supabase-contract.service';
   
   // Your contract creation code here
   const { id, error } = await SupabaseContractService.saveContract({
     contract: myContract,
     photoFiles: [],
   });
   ```

3. **Implement auth screens** in your app

4. **Read full docs**: See `supabase/README.md` and `supabase/MIGRATION_GUIDE.md`

## Quick Reference

### Important URLs
- **Dashboard**: https://supabase.com/dashboard/project/kwjtqsomuwdotfkrqbne
- **SQL Editor**: https://supabase.com/dashboard/project/kwjtqsomuwdotfkrqbne/sql
- **Auth Users**: https://supabase.com/dashboard/project/kwjtqsomuwdotfkrqbne/auth/users
- **Storage**: https://supabase.com/dashboard/project/kwjtqsomuwdotfkrqbne/storage/buckets

### Key Files
- `utils/supabase.ts` - Supabase client
- `services/auth.service.ts` - Authentication methods
- `services/supabase-contract.service.ts` - Contract operations
- `models/database.types.ts` - TypeScript types

### Quick Commands
```bash
# Start development server
npm start

# Clear cache and restart
npm start -- --clear

# Build for production
npx eas build --platform all
```

## Troubleshooting

**"Invalid API key"**
→ Check `.env` file and restart `npm start`

**"Row Level Security policy violation"**
→ Make sure you're signed in: `await AuthService.signIn({...})`

**"Storage upload failed"**
→ Verify storage buckets are created via storage-setup.sql

**Still stuck?**
→ Check [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md#troubleshooting)

---

**Need more details?** See:
- [README.md](./README.md) - Full API reference
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Complete migration guide

