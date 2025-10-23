# 🔒 Contract Permissions Implementation

## Overview
This document describes the permission system implemented for contract management.

## ✅ Permission Rules

### 1. **VIEW Contracts**
- ✅ **ALL authenticated users** can view all contracts
- No restrictions on viewing

### 2. **CREATE Contracts**
- ✅ **ALL authenticated users** can create new contracts
- No restrictions on creation

### 3. **EDIT Contracts**
- ✅ **ALL authenticated users** can edit ANY contract
- No ownership restrictions
- Anyone can update any contract

### 4. **DELETE Contracts** 🔒
- ❌ **ONLY the owner** can delete their own contract
- **Restricted by user_id match**
- Other users cannot delete contracts they don't own

## 🎯 User Experience

### When Viewing a Contract You Own:
- ✅ **Edit** button: Active - Click to edit
- ✅ **Delete** button: Active - Click to delete (with confirmation)

### When Viewing Someone Else's Contract:
- ✅ **Edit** button: Active - You CAN edit it
- 🔒 **Delete** button: **Disabled** - Shows "Μη Διαθέσιμο" (Not Available) with lock icon
- If you try to delete (in case of bug/bypass), shows error: **"Δεν έχετε δικαίωμα να διαγράψετε αυτό το συμβόλαιο"**

## 🔧 Implementation Details

### Frontend Protection
**File: `app/contract-details.tsx`**

```typescript
// Only show delete button if user owns this contract
{currentUserId === contract.userId ? (
  <TouchableOpacity onPress={handleDelete}>
    <Text>Διαγραφή</Text>
  </TouchableOpacity>
) : (
  <View style={btnDisabled}>
    <Ionicons name="lock-closed" />
    <Text>Μη Διαθέσιμο</Text>
  </View>
)}
```

### Error Handling
If a user somehow tries to delete someone else's contract:

```typescript
catch (error) {
  // Check if this is a permission error
  if (errorMessage.includes('policy') || errorMessage.includes('permission')) {
    Alert.alert(
      'Δεν Επιτρέπεται',
      'Δεν έχετε δικαίωμα να διαγράψετε αυτό το συμβόλαιο. Μπορείτε να διαγράψετε μόνο τα δικά σας συμβόλαια.'
    );
  }
}
```

### Backend Protection (RLS Policies)
**File: `supabase/fix-rls-allow-all-edits.sql`**

Run this SQL in Supabase SQL Editor:

```sql
-- Allow all authenticated users to update any contract
CREATE POLICY "Authenticated users can update all contracts"
  ON public.contracts
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Only allow owners to delete their own contracts
CREATE POLICY "Users can delete own contracts"
  ON public.contracts
  FOR DELETE
  USING (auth.uid() = user_id);
```

## 📝 Setup Instructions

### Step 1: Update RLS Policies
1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Run the script: `supabase/fix-rls-allow-all-edits.sql`
4. Verify the policies with the included verification query

### Step 2: Test the Implementation
1. **Login as User A**
2. Create a contract → Should work ✅
3. View the contract → Should see Edit and Delete buttons ✅
4. **Login as User B**
5. View User A's contract → Should see Edit button and disabled Delete button ✅
6. Try to edit User A's contract → Should work ✅
7. Try to delete User A's contract → Should see "Μη Διαθέσιμο" or error message ❌

## 🐛 Troubleshooting

### Problem: Can't delete own contract
**Solution:** Check if `currentUserId === contract.userId`. Run this SQL to verify:
```sql
SELECT id, user_id, renter_full_name 
FROM contracts 
WHERE id = 'YOUR_CONTRACT_ID';
```

### Problem: Can delete someone else's contract
**Solution:** RLS policy not applied correctly. Re-run `fix-rls-allow-all-edits.sql`

### Problem: Can't edit any contract
**Solution:** Check the UPDATE policy:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'contracts' AND cmd = 'UPDATE';
```

## 📚 Related Files
- `app/contract-details.tsx` - Contract viewing with delete restrictions
- `app/edit-contract.tsx` - Contract editing (no restrictions)
- `supabase/fix-rls-allow-all-edits.sql` - Database policies
- `supabase/check-contract-ownership.sql` - Diagnostic queries

