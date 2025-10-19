# Authentication User ID Fix

## Problem
Contracts were failing to save with the error:
```
invalid input syntax for type uuid: "default-user"
```

## Root Cause
The app had a **fundamental architecture mismatch**:
- The `user_id` field in the Supabase `contracts` table expected a **UUID from Supabase Auth** (`auth.users`)
- The app was using a **local file-based user system** (`UserStorageService`) that generated non-UUID IDs like timestamps

## Solution
Updated `app/new-contract.tsx` to use the authenticated Supabase user:

### Changes Made:
1. **Replaced UserStorageService with AuthService**
   - Changed import from `UserStorageService` to `AuthService`
   - Removed local user selection state and UI

2. **Updated handleSaveContract function**
   - Now calls `AuthService.getCurrentUser()` to get the authenticated user
   - Uses `currentUser.id` (a proper UUID) instead of `selectedUserId`
   - Added validation to check if user is logged in before saving

3. **Removed User Selection UI**
   - Removed user dropdown/button from the header
   - Users are automatically associated with their Supabase Auth account

### Key Code Changes:
```typescript
// OLD: Using local user
userId: selectedUserId, // ❌ Non-UUID string

// NEW: Using authenticated Supabase user
const currentUser = await AuthService.getCurrentUser();
if (!currentUser) {
  Alert.alert('Σφάλμα', 'Δεν είστε συνδεδεμένος. Παρακαλώ συνδεθείτε πρώτα.');
  return;
}
userId: currentUser.id, // ✅ Proper UUID
```

## Testing
1. Make sure you're **logged in** with a Supabase Auth account
2. Create a new contract
3. The contract should save successfully and appear in the contracts list

## Notes
- The app now requires users to be authenticated via Supabase Auth to create contracts
- The old `UserStorageService` local file-based user system is no longer used for contract creation
- Users can sign up/sign in via the authentication screens

