# Supabase Integration for Car Rental App

## 📋 Table of Contents
- [Overview](#overview)
- [Quick Start](#quick-start)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [API Reference](#api-reference)
- [Security](#security)

## Overview

This app uses Supabase as a backend-as-a-service for:
- **PostgreSQL Database** - Store contracts, users, damages, and photos metadata
- **Authentication** - Secure user authentication and session management
- **Storage** - Store contract photos and signatures
- **Row Level Security (RLS)** - Secure data access at the database level

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

All required Supabase packages are already installed:
- `@supabase/supabase-js`
- `@react-native-async-storage/async-storage`
- `react-native-url-polyfill`

### 2. Configure Environment
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=https://kwjtqsomuwdotfkrqbne.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Set Up Database

**Using Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Open SQL Editor
3. Run `supabase/schema.sql`
4. Run `supabase/storage-setup.sql`

**Using CLI:**
```bash
supabase db push
```

### 4. Start Development
```bash
npm start
```

## Database Schema

### Tables

#### `users`
Staff/employee profiles that extend Supabase auth.users

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, references auth.users |
| name | TEXT | User's full name |
| signature_url | TEXT | URL to user's signature |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### `contracts`
Car rental contracts

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Staff member who created the contract |
| renter_full_name | TEXT | Renter's name |
| renter_id_number | TEXT | Renter's ID number |
| renter_tax_id | TEXT | ΑΦΜ (Tax ID) |
| renter_driver_license_number | TEXT | Driver's license |
| renter_phone_number | TEXT | Phone number |
| renter_email | TEXT | Email address |
| renter_address | TEXT | Address |
| pickup_date | TIMESTAMP | Pickup date/time |
| pickup_time | TEXT | Pickup time string |
| pickup_location | TEXT | Pickup location |
| dropoff_date | TIMESTAMP | Dropoff date/time |
| dropoff_time | TEXT | Dropoff time string |
| dropoff_location | TEXT | Dropoff location |
| is_different_dropoff_location | BOOLEAN | Different dropoff? |
| total_cost | DECIMAL | Total rental cost |
| car_make_model | TEXT | Car make and model |
| car_year | INTEGER | Car year |
| car_license_plate | TEXT | License plate |
| car_mileage | INTEGER | Mileage in km |
| fuel_level | INTEGER | Fuel level (1-8) |
| insurance_type | TEXT | 'basic' or 'full' |
| client_signature_url | TEXT | URL to client signature |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### `damage_points`
Damage markers on car diagram

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| contract_id | UUID | Related contract |
| x_position | DECIMAL | X position (0-100%) |
| y_position | DECIMAL | Y position (0-100%) |
| view_side | TEXT | 'front', 'rear', 'left', 'right' |
| description | TEXT | Damage description |
| severity | TEXT | 'minor', 'moderate', 'severe' |
| created_at | TIMESTAMP | Creation timestamp |

#### `photos`
Contract photo metadata

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| contract_id | UUID | Related contract |
| photo_url | TEXT | Public URL to photo |
| storage_path | TEXT | Path in storage bucket |
| file_size | INTEGER | File size in bytes |
| mime_type | TEXT | MIME type |
| order_index | INTEGER | Display order |
| created_at | TIMESTAMP | Creation timestamp |

### Storage Buckets

#### `contract-photos` (Public)
- Stores contract vehicle photos
- Max size: 10 MB per file
- Allowed types: JPEG, PNG, WebP

#### `signatures` (Private)
- Stores user and client signatures
- Max size: 2 MB per file
- Allowed types: PNG, SVG, JPEG

## Authentication

### Sign Up
```typescript
import { AuthService } from './services/auth.service';

const { user, error } = await AuthService.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  name: 'Διαχειριστής',
});
```

### Sign In
```typescript
const { user, error } = await AuthService.signIn({
  email: 'user@example.com',
  password: 'securePassword123',
});
```

### Get Current User
```typescript
const user = await AuthService.getCurrentUser();
```

### Sign Out
```typescript
const { error } = await AuthService.signOut();
```

### Auth State Changes
```typescript
const { data: { subscription } } = AuthService.onAuthStateChange(
  (event, session) => {
    if (event === 'SIGNED_IN') {
      console.log('User signed in:', session);
    }
  }
);

// Cleanup
subscription.unsubscribe();
```

## API Reference

### Contract Operations

#### Save Contract
```typescript
import { SupabaseContractService } from './services/supabase-contract.service';

const { id, error } = await SupabaseContractService.saveContract({
  contract: myContract,
  photoFiles: [
    { uri: 'file://...', fileName: 'photo1.jpg' },
    { uri: 'file://...', fileName: 'photo2.jpg' },
  ],
});
```

#### Get All Contracts
```typescript
const contracts = await SupabaseContractService.getAllContracts();
```

#### Get Contract by ID
```typescript
const contract = await SupabaseContractService.getContractById(contractId);
```

#### Search Contracts
```typescript
const results = await SupabaseContractService.searchContracts('Tesla');
```

#### Delete Contract
```typescript
const { error } = await SupabaseContractService.deleteContract(contractId);
```

### Direct Database Access

For more control, use the Supabase client directly:

```typescript
import { supabase } from './utils/supabase';

// Query contracts
const { data, error } = await supabase
  .from('contracts')
  .select('*, damage_points(*), photos(*)')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// Insert damage point
const { data, error } = await supabase
  .from('damage_points')
  .insert({
    contract_id: contractId,
    x_position: 50,
    y_position: 30,
    view_side: 'front',
    description: 'Scratch on hood',
    severity: 'minor',
  });
```

### Storage Operations

#### Upload File
```typescript
const { data, error } = await supabase.storage
  .from('contract-photos')
  .upload(`contracts/${contractId}/photo1.jpg`, fileBlob);
```

#### Get Public URL
```typescript
const { data } = supabase.storage
  .from('contract-photos')
  .getPublicUrl('contracts/123/photo1.jpg');

console.log(data.publicUrl);
```

#### Delete File
```typescript
const { error } = await supabase.storage
  .from('contract-photos')
  .remove(['contracts/123/photo1.jpg']);
```

## Security

### Row Level Security (RLS)

All tables have RLS enabled. Policies ensure:
- Users can only access their own data
- Authenticated users can create contracts
- Contracts are visible to all authenticated users
- Users can only modify their own contracts

### Storage Security

Storage buckets use policies to:
- Allow authenticated users to upload files
- Organize files by user/contract
- Prevent unauthorized access to private signatures

### Best Practices

1. **Never disable RLS** - Always keep Row Level Security enabled
2. **Use environment variables** - Never hardcode API keys
3. **Validate input** - Always validate user input before database operations
4. **Use TypeScript types** - Leverage database types for type safety
5. **Handle errors** - Always check for errors in responses
6. **Secure storage** - Use appropriate bucket policies
7. **Regular backups** - Set up automated database backups

## Monitoring

### Check Logs
```typescript
// API logs in Supabase Dashboard
// Authentication → Logs
// Database → Query Performance
```

### Performance Tips

1. Use indexes for frequently queried columns
2. Select only needed columns
3. Use pagination for large datasets
4. Optimize photo sizes before upload
5. Use connection pooling for high traffic

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **React Native Guide**: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
- **API Reference**: https://supabase.com/docs/reference/javascript/introduction
- **Discord Community**: https://discord.supabase.com

## Troubleshooting

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md#troubleshooting) for common issues and solutions.

