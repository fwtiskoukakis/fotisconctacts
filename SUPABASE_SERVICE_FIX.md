# Supabase Contract Service Fix

## Problem

Contracts were saved with "success" message but never appeared in the contracts list.

## Root Cause

The `SupabaseContractService` was **missing critical methods**:
- ❌ No `saveContract()` method 
- ❌ No `updateContract()` method

The service only had read and delete operations, but no create/update operations!

When the app tried to call `SupabaseContractService.saveContract(contract)`, it **failed silently** because the method didn't exist.

## Solution

### Added Missing Methods

#### 1. `saveContract(contract: Contract)` 
✅ Creates new contract in Supabase
- Maps all contract fields to database schema
- Handles renter info, rental period, car info, condition
- Saves damage points with `marker_type` field
- Returns the saved contract

#### 2. `updateContract(id: string, contract: Contract)`
✅ Updates existing contract in Supabase
- Updates all contract fields
- Deletes old damage points
- Inserts new damage points
- Returns the updated contract

#### 3. Updated `mapSupabaseToContract()` 
✅ Added `markerType` mapping for damage points
- Maps `marker_type` from database to `markerType` in contract
- Defaults to `'slight-scratch'` if not present

## Key Schema Mappings

### Contract Fields
```typescript
{
  // App → Database
  userId → user_id
  renterInfo.fullName → renter_full_name
  renterInfo.idNumber → renter_id_number
  renterInfo.taxId → renter_tax_id
  // ... etc
  rentalPeriod.pickupDate → pickup_date
  rentalPeriod.pickupTime → pickup_time
  // ... etc
  carInfo.makeModel → car_make_model
  carInfo.licensePlate → car_license_plate
  // ... etc
  carCondition.fuelLevel → fuel_level
  carCondition.insuranceType → insurance_type
  clientSignature → client_signature_url
}
```

### Damage Points Fields
```typescript
{
  // App → Database
  contract.id → contract_id
  x → x_position
  y → y_position
  view → view_side
  markerType → marker_type
  severity → severity
  description → description
}
```

## Files Modified

1. `services/supabase-contract.service.ts`
   - ✅ Added `saveContract()` method
   - ✅ Added `updateContract()` method  
   - ✅ Updated `mapSupabaseToContract()` to include `markerType`

2. `app/new-contract.tsx` (from previous fix)
   - ✅ Uses `SupabaseContractService.saveContract()`
   - ✅ Calculates contract status

3. `app/edit-contract.tsx` (from previous fix)
   - ✅ Uses `SupabaseContractService.updateContract()`

## Testing

To verify the fix:

1. ✅ Create a new contract with all fields filled
2. ✅ Add damage markers with different types
3. ✅ Save the contract
4. ✅ Check that success message appears
5. ✅ Navigate to Contracts tab
6. ✅ Verify contract appears in the list
7. ✅ Open contract details
8. ✅ Verify all data is correct including damage markers

## Database Requirements

Ensure Supabase tables exist:

### `contracts` table
- All snake_case fields as per schema
- RLS policies enabled for authenticated users

### `damage_points` table  
- Includes `marker_type` column
- Foreign key to `contracts.id`
- RLS policies enabled

## Error Handling

Both methods now:
- ✅ Catch and log errors
- ✅ Throw errors with context
- ✅ Return typed data
- ✅ Handle missing optional fields

## Next Steps

If contracts still don't appear:
1. Check browser/app console for errors
2. Verify Supabase connection (check `.env` file)
3. Check RLS policies allow INSERT/UPDATE
4. Verify user is authenticated
5. Check network tab for failed requests

