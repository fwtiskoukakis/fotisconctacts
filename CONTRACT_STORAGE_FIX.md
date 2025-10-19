# Contract Storage Fix

## Problem

Contracts were being saved successfully but not showing up in the contracts list.

## Root Cause

The application had two different storage services:
1. **ContractStorageService** - File-based storage using Expo FileSystem
2. **SupabaseContractService** - Cloud-based storage using Supabase database

**The Issue:**
- `new-contract.tsx` was using `ContractStorageService` to **save** contracts (to file system)
- `contracts.tsx` was using `SupabaseContractService` to **load** contracts (from Supabase)
- **Missing `status` field** in the contract object being saved

Result: Contracts were saved to the file system but the app was looking for them in Supabase!

## Solution

### Files Updated

#### 1. `app/new-contract.tsx`
- ✅ Changed from `ContractStorageService` to `SupabaseContractService`
- ✅ Added automatic `status` calculation based on pickup/dropoff dates:
  - `upcoming` - if pickup date is in the future
  - `active` - if today is between pickup and dropoff dates
  - `completed` - if dropoff date has passed
- ✅ Updated success message to navigate to contracts page

#### 2. `app/edit-contract.tsx`
- ✅ Changed from `ContractStorageService` to `SupabaseContractService`
- ✅ Updated `getContractById` to use Supabase service
- ✅ Updated save method to use `updateContract` instead of `saveContract`

## Code Changes

### Contract Status Calculation
```typescript
// Determine contract status based on dates
const today = new Date();
today.setHours(0, 0, 0, 0);
const pickupDate = new Date(rentalPeriod.pickupDate);
pickupDate.setHours(0, 0, 0, 0);
const dropoffDate = new Date(rentalPeriod.dropoffDate);
dropoffDate.setHours(0, 0, 0, 0);

let status: 'active' | 'completed' | 'upcoming';
if (today < pickupDate) {
  status = 'upcoming';
} else if (today > dropoffDate) {
  status = 'completed';
} else {
  status = 'active';
}
```

### Service Usage
**Before:**
```typescript
import { ContractStorageService } from '../services/contract-storage.service';
await ContractStorageService.saveContract(contract);
```

**After:**
```typescript
import { SupabaseContractService } from '../services/supabase-contract.service';
await SupabaseContractService.saveContract(contract);
```

## Testing

To verify the fix works:

1. ✅ Create a new contract
2. ✅ Fill in all required fields
3. ✅ Save the contract
4. ✅ Navigate to Contracts tab
5. ✅ Verify the contract appears in the list

## Migration Note

If there are any contracts previously saved to the file system, they will NOT automatically appear in Supabase. A migration script would be needed to transfer them if required.

## Related Files

- `services/supabase-contract.service.ts` - Cloud storage service (NOW USED)
- `services/contract-storage.service.ts` - File storage service (DEPRECATED for now)
- `app/(tabs)/contracts.tsx` - Contract list page (already using Supabase)
- `app/contract-details.tsx` - Contract details page (already using Supabase)
- `models/contract.interface.ts` - Contract type definition

## Future Considerations

1. Consider removing or clearly marking `ContractStorageService` as deprecated
2. Add migration utility if needed to move file-based contracts to Supabase
3. Ensure all other pages use `SupabaseContractService` consistently
4. Add status update job to automatically update contract statuses daily

