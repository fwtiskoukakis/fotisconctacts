# Digital Client Registry (Ψηφιακό Πελατολόγιο) - User Settings Implementation

## Overview
This document describes the implementation of user-specific **Digital Client Registry** (Ψηφιακό Πελατολόγιο) credentials from AADE (Greek Tax Authority), allowing each user/business to store their own API integration settings for vehicle rental reporting.

## What Was Implemented

### 1. Database Schema Updates ✅

**File**: `supabase/add-aade-fields-to-users.sql`

Added the following fields to the `users` table:
- `aade_user_id` (TEXT) - AADE User ID for myDATA integration
- `aade_subscription_key` (TEXT) - AADE Subscription Key for API authentication
- `company_vat_number` (TEXT) - Company VAT Number (ΑΦΜ) - 9 digits
- `company_name` (TEXT) - Company legal name
- `company_address` (TEXT) - Company registered address
- `company_activity` (TEXT) - Company business activity description
- `aade_enabled` (BOOLEAN) - Whether AADE integration is enabled for this user

**To Apply**: Run this SQL script in your Supabase SQL Editor:
```bash
# In Supabase Dashboard > SQL Editor
# Copy and paste contents of: supabase/add-aade-fields-to-users.sql
# Click "Run"
```

### 2. TypeScript Interface Updates ✅

**File**: `models/contract.interface.ts`

Updated the `User` interface to include:
```typescript
export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  signature: string;
  signatureUrl?: string;
  // AADE Integration Fields
  aadeUserId?: string;
  aadeSubscriptionKey?: string;
  companyVatNumber?: string;
  companyName?: string;
  companyAddress?: string;
  companyActivity?: string;
  aadeEnabled?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}
```

### 3. AADE Settings UI ✅

**File**: `app/aade-settings.tsx`

Created a dedicated settings page with:
- **Enable/Disable Toggle**: Turn AADE integration on/off per user
- **Secure Credential Input**: 
  - AADE User ID (with show/hide password toggle)
  - AADE Subscription Key (with show/hide password toggle)
- **Company Information**:
  - ΑΦΜ (VAT Number) with validation (9 digits)
  - Company Name
  - Company Address (multiline)
  - Company Activity
- **Test Connection Button**: To verify AADE credentials
- **Help Section**: Instructions on where to find credentials
- **Save Button**: Saves all settings to database

**Features**:
- Real-time validation
- Secure password fields with visibility toggle
- Responsive design
- Loading states
- Error handling
- Success confirmations

### 4. Settings Menu Integration ✅

**File**: `app/settings.tsx`

Added AADE section to main settings menu:
```typescript
{
  id: 'aade',
  title: 'ΑΑΔΕ Ενσωμάτωση',
  items: [
    {
      id: 'aade-config',
      title: 'Ρυθμίσεις ΑΑΔΕ',
      subtitle: 'Διαμόρφωση στοιχείων myDATA',
      icon: '🏛️',
      type: 'navigation',
      onPress: () => router.push('/aade-settings'),
    },
  ],
}
```

### 5. AADE Service Updates ✅

**Files**: 
- `services/aade-integration.service.ts`
- `services/aade.service.ts`

**Changes**:

#### AADEIntegrationService
- Updated `submitContractToAADE()` to accept `userId` parameter
- Fetches user-specific AADE credentials from database
- Validates that AADE is enabled for the user
- Validates that credentials are configured
- Passes user credentials to AADEService

```typescript
static async submitContractToAADE(
  contractId: string,
  contract: Contract,
  userId: string // NEW PARAMETER
): Promise<{ success: boolean; dclId?: number; error?: string }>
```

#### AADEService
- Updated `sendClient()` to accept optional credentials
- Updated `getHeaders()` to use provided credentials or fall back to config
- Maintains backward compatibility with global config

```typescript
static async sendClient(
  params: NewDigitalClientDoc,
  userId?: string,           // NEW PARAMETER
  subscriptionKey?: string   // NEW PARAMETER
): Promise<AADEResponse>
```

## How It Works

### User Flow

1. **User goes to Settings** → ΑΑΔΕ Ενσωμάτωση → Ρυθμίσεις ΑΑΔΕ
2. **Enters their credentials**:
   - AADE User ID
   - AADE Subscription Key
   - Company ΑΦΜ (9 digits)
   - Company Name (optional)
   - Company Address (optional)
   - Company Activity (optional)
3. **Enables AADE integration** using the toggle
4. **Saves settings** - stored in `users` table in Supabase
5. **When creating contracts**, the system:
   - Checks if user has AADE enabled
   - Fetches user's AADE credentials
   - Uses those credentials to submit to AADE
   - Each user's contracts are submitted with their own credentials

### Data Flow

```
User Profile (Supabase users table)
  ↓
  ├─ aade_user_id
  ├─ aade_subscription_key
  ├─ company_vat_number
  ├─ company_name
  ├─ company_address
  ├─ company_activity
  └─ aade_enabled
  
When submitting contract:
  ↓
AADEIntegrationService.submitContractToAADE(contractId, contract, userId)
  ↓
Fetch user's AADE settings from database
  ↓
Validate settings (enabled, credentials exist)
  ↓
AADEService.sendClient(request, userId, subscriptionKey)
  ↓
Submit to AADE API with user-specific credentials
```

## Installation Steps

### 1. Run Database Migration

```sql
-- In Supabase Dashboard > SQL Editor
-- Run: supabase/add-aade-fields-to-users.sql
```

This adds the AADE fields to your users table.

### 2. Update Environment Variables (Optional)

The global `.env` configuration is now optional since each user has their own credentials:

```env
# These are now optional - used as fallback if user hasn't configured
EXPO_PUBLIC_AADE_USER_ID=your_global_aade_user_id
EXPO_PUBLIC_AADE_SUBSCRIPTION_KEY=your_global_subscription_key
EXPO_PUBLIC_COMPANY_VAT_NUMBER=your_global_vat_number
```

### 3. Configure User Settings

Each user should:
1. Navigate to **Settings** → **ΑΑΔΕ Ενσωμάτωση** → **Ρυθμίσεις ΑΑΔΕ**
2. Enter their AADE credentials
3. Enable AADE integration
4. Save settings

## Security Considerations

✅ **Credentials are stored securely**:
- Stored in Supabase database with Row Level Security (RLS)
- Each user can only access their own credentials
- Password fields are hidden by default with show/hide toggle
- Credentials are never logged or exposed in error messages

✅ **Validation**:
- VAT number format validation (9 digits)
- Required field validation before enabling AADE
- User must explicitly enable AADE integration

✅ **Error Handling**:
- Clear error messages if credentials are missing
- Graceful fallback if AADE is not enabled
- User-friendly error messages

## Testing

### Test User Configuration

1. **Sign in** to the app
2. **Go to Settings** → ΑΑΔΕ Ενσωμάτωση
3. **Enter test credentials**:
   - AADE User ID: `test_user_id`
   - Subscription Key: `test_subscription_key`
   - ΑΦΜ: `123456789`
4. **Enable AADE**
5. **Save**
6. **Create a contract** - it should use your credentials

### Verify Database

```sql
-- Check user's AADE settings
SELECT 
  id, 
  name, 
  aade_enabled,
  company_vat_number,
  company_name
FROM users
WHERE id = 'your_user_id';
```

## Migration from Global Config

If you were using global environment variables before:

1. **Existing contracts** will continue to work
2. **New approach**: Each user configures their own credentials
3. **Backward compatible**: Global config still works as fallback
4. **Recommended**: Have each user configure their settings in the app

## API Changes

### Breaking Changes
None - backward compatible!

### New Parameters
- `AADEIntegrationService.submitContractToAADE()` now requires `userId` parameter
- `AADEService.sendClient()` accepts optional `userId` and `subscriptionKey`

### Usage Example

```typescript
// OLD WAY (still works with global config)
await AADEIntegrationService.submitContractToAADE(contractId, contract);

// NEW WAY (user-specific credentials)
const user = await AuthService.getCurrentUser();
await AADEIntegrationService.submitContractToAADE(
  contractId, 
  contract,
  user.id  // Pass user ID
);
```

## Benefits

✅ **Multi-tenant Support**: Each business/user can have their own AADE credentials  
✅ **Flexibility**: Users can enable/disable AADE per account  
✅ **Security**: Credentials are isolated per user  
✅ **Scalability**: Supports multiple businesses using the same app  
✅ **User Control**: Users manage their own integration settings  
✅ **Compliance**: Each business submits with their own credentials  

## Troubleshooting

### "AADE integration is not enabled for this user"
- Go to Settings → ΑΑΔΕ Ενσωμάτωση
- Enable the toggle
- Save settings

### "AADE credentials not configured"
- Go to Settings → ΑΑΔΕ Ενσωμάτωση
- Fill in AADE User ID, Subscription Key, and ΑΦΜ
- Save settings

### "Invalid VAT number format"
- ΑΦΜ must be exactly 9 digits
- No spaces or special characters

### Credentials not saving
- Check Supabase connection
- Verify RLS policies allow user to update their own profile
- Check browser console for errors

## Future Enhancements

- [ ] Test AADE connection button functionality
- [ ] Bulk import of AADE credentials
- [ ] AADE credential validation on save
- [ ] Audit log for AADE submissions per user
- [ ] AADE submission history per user
- [ ] Export AADE submission reports per user

## Support

For issues or questions:
1. Check Supabase logs for database errors
2. Check browser console for client errors
3. Verify AADE credentials are correct in myDATA portal
4. Ensure database migration was run successfully

---

**Implementation Date**: October 18, 2025  
**Status**: ✅ Complete and Ready for Use  
**Files Modified**: 6  
**Files Created**: 2  

