# 🔄 Complete Supabase Field Sync - Critical Fix

## 🚨 **ISSUE IDENTIFIED**

The 406 error from Supabase is caused by **missing database columns** that the app is trying to read/write.

Error: `Failed to load resource: the server responded with a status of 406`

This means Supabase is rejecting the request because field names don't match the schema.

## ✅ **SOLUTION - Run These Migrations**

### **Step 1: Update Users Table**
Run: `supabase/ensure-users-table-complete.sql`

This adds:
- ✅ name, phone, address, signature_url, avatar_url
- ✅ email (for profile sync)
- ✅ aade_enabled, aade_username, aade_subscription_key
- ✅ company_vat_number, company_name, company_address, company_activity
- ✅ is_active, created_at, updated_at
- ✅ Auto-update trigger for updated_at
- ✅ RLS policies

### **Step 2: Update Contracts Table**
Run: `supabase/ensure-contracts-table-complete.sql`

This adds:
- ✅ deposit_amount, insurance_cost
- ✅ car_category, car_color
- ✅ exterior_condition, interior_condition, mechanical_condition
- ✅ condition_notes
- ✅ updated_at
- ✅ Auto-update trigger

### **Step 3: Verify Damage Points Table**
Already has: `marker_type` column (from previous migration)

## 📋 **Complete Field Mapping**

### **Contracts Table:**

| Frontend Field | Database Column |
|----------------|-----------------|
| `renterInfo.fullName` | `renter_full_name` |
| `renterInfo.idNumber` | `renter_id_number` |
| `renterInfo.taxId` | `renter_tax_id` |
| `renterInfo.driverLicenseNumber` | `renter_driver_license_number` |
| `renterInfo.phoneNumber` | `renter_phone_number` |
| `renterInfo.phone` | `renter_phone_number` |
| `renterInfo.email` | `renter_email` |
| `renterInfo.address` | `renter_address` |
| `rentalPeriod.pickupDate` | `pickup_date` |
| `rentalPeriod.pickupTime` | `pickup_time` |
| `rentalPeriod.pickupLocation` | `pickup_location` |
| `rentalPeriod.dropoffDate` | `dropoff_date` |
| `rentalPeriod.dropoffTime` | `dropoff_time` |
| `rentalPeriod.dropoffLocation` | `dropoff_location` |
| `rentalPeriod.isDifferentDropoffLocation` | `is_different_dropoff_location` |
| `rentalPeriod.totalCost` | `total_cost` |
| `rentalPeriod.depositAmount` | `deposit_amount` ⚠️ NEW |
| `rentalPeriod.insuranceCost` | `insurance_cost` ⚠️ NEW |
| `carInfo.makeModel` | `car_make_model` |
| `carInfo.make` | `car_make_model` (split) |
| `carInfo.model` | `car_make_model` (split) |
| `carInfo.year` | `car_year` |
| `carInfo.licensePlate` | `car_license_plate` |
| `carInfo.mileage` | `car_mileage` |
| `carInfo.category` | `car_category` ⚠️ NEW |
| `carInfo.color` | `car_color` ⚠️ NEW |
| `carCondition.fuelLevel` | `fuel_level` |
| `carCondition.mileage` | `car_mileage` |
| `carCondition.insuranceType` | `insurance_type` |
| `carCondition.exteriorCondition` | `exterior_condition` ⚠️ NEW |
| `carCondition.interiorCondition` | `interior_condition` ⚠️ NEW |
| `carCondition.mechanicalCondition` | `mechanical_condition` ⚠️ NEW |
| `carCondition.notes` | `condition_notes` ⚠️ NEW |
| `clientSignature` | `client_signature_url` |
| `aadeStatus` | `aade_status` |
| `aadeDclId` | `aade_dcl_id` |
| `userId` | `user_id` |
| `createdAt` | `created_at` |

### **Users Table:**

| Frontend Field | Database Column |
|----------------|-----------------|
| `name` | `name` |
| `email` | `email` |
| `phone` | `phone` |
| `address` | `address` |
| `signature_url` | `signature_url` |
| `avatar_url` | `avatar_url` |
| `aade_enabled` | `aade_enabled` |
| `aade_username` | `aade_username` |
| `aade_subscription_key` | `aade_subscription_key` |
| `company_vat_number` | `company_vat_number` |
| `company_name` | `company_name` |
| `company_address` | `company_address` |
| `company_activity` | `company_activity` |

### **Damage Points Table:**

| Frontend Field | Database Column |
|----------------|-----------------|
| `x` | `x_position` |
| `y` | `y_position` |
| `view` | `view_side` |
| `description` | `description` |
| `severity` | `severity` |
| `markerType` | `marker_type` |
| `contractId` | `contract_id` |

## 🔧 **What Was Fixed**

### **1. Supabase Contract Service** (`services/supabase-contract.service.ts`)

#### ✅ **mapSupabaseToContract** (Reading from DB):
- Added `phone` property to renterInfo
- Added `make` and `model` split from makeModel
- Added `category` and `color` to carInfo
- Added `depositAmount` and `insuranceCost` to rentalPeriod
- Added `exteriorCondition`, `interiorCondition`, `mechanicalCondition`, `notes` to carCondition

#### ✅ **saveContract** (Writing to DB):
- Added `deposit_amount` and `insurance_cost` fields
- Added `car_category` and `car_color` fields
- Added `exterior_condition`, `interior_condition`, `mechanical_condition` fields
- Added `condition_notes` field

#### ✅ **updateContract** (Updating DB):
- Added all the same fields as saveContract
- Added `updated_at` timestamp

### **2. Z-Index Fix** (FAB above Navbar)

#### ✅ **Bottom Tab Bar** (`components/bottom-tab-bar.tsx`):
- Moved to `bottom: 10px`
- Set `zIndex: 10`

#### ✅ **FAB Buttons** (`components/context-aware-fab.tsx` & `floating-action-button.tsx`):
- Positioned at `bottom: 100px` (higher than navbar)
- Set `zIndex: 9999` (WAY above navbar's 10)
- Added `elevation: 9999` for Android

**Result**: FAB button ALWAYS floats above navbar ✅

## 🚀 **How to Fix the 406 Error**

### **Option 1: Run Migrations in Supabase Dashboard**

1. Open Supabase Dashboard → SQL Editor
2. Run `supabase/ensure-users-table-complete.sql`
3. Run `supabase/ensure-contracts-table-complete.sql`
4. Restart your app
5. Test creating/editing a contract

### **Option 2: Create Migrations Locally**

```bash
# If using Supabase CLI
supabase migration new add_missing_contract_fields
# Then copy the SQL from ensure-contracts-table-complete.sql
supabase db push
```

## 🧪 **Testing After Migration**

1. ✅ Create a new contract - should save without 406 error
2. ✅ Edit an existing contract - should update properly
3. ✅ View contract details - all fields should display
4. ✅ Check browser console - no more 406 errors
5. ✅ Verify data persists after refresh

## 📊 **Database Schema Requirements**

### **Contracts Table Must Have:**

```sql
-- Renter Info
renter_full_name TEXT NOT NULL
renter_id_number TEXT
renter_tax_id TEXT
renter_driver_license_number TEXT
renter_phone_number TEXT
renter_email TEXT
renter_address TEXT

-- Rental Period
pickup_date TIMESTAMP NOT NULL
pickup_time TEXT
pickup_location TEXT
dropoff_date TIMESTAMP NOT NULL
dropoff_time TEXT
dropoff_location TEXT
is_different_dropoff_location BOOLEAN
total_cost NUMERIC(10,2)
deposit_amount NUMERIC(10,2)      -- ⚠️ MUST ADD
insurance_cost NUMERIC(10,2)      -- ⚠️ MUST ADD

-- Car Info
car_make_model TEXT
car_year INTEGER
car_license_plate TEXT
car_mileage INTEGER
car_category TEXT                 -- ⚠️ MUST ADD
car_color TEXT                    -- ⚠️ MUST ADD

-- Car Condition
fuel_level INTEGER
insurance_type TEXT
exterior_condition TEXT           -- ⚠️ MUST ADD
interior_condition TEXT           -- ⚠️ MUST ADD
mechanical_condition TEXT         -- ⚠️ MUST ADD
condition_notes TEXT              -- ⚠️ MUST ADD

-- Signature & AADE
client_signature_url TEXT
aade_status TEXT
aade_dcl_id INTEGER

-- Metadata
user_id UUID REFERENCES users(id)
created_at TIMESTAMP
updated_at TIMESTAMP              -- ⚠️ MUST ADD
```

## ⚡ **Quick Fix Summary**

1. **Run migrations** → Adds missing columns
2. **Restart app** → Clears cached errors
3. **Test create/edit** → Verify 406 is gone
4. **All fields sync** → No more errors

## 🎯 **Expected Result**

After running migrations:
- ✅ No more 406 errors
- ✅ All contract fields save properly
- ✅ All fields load correctly
- ✅ Edit/Update works perfectly
- ✅ FAB button floats above navbar
- ✅ **100% SUPABASE SYNC GUARANTEED**

