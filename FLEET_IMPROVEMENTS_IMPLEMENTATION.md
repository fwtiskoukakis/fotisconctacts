# FleetOS Improvements Implementation Guide

## Overview
This document outlines the implementation of new features for the FleetOS car rental management system.

## Table of Contents
1. [Dark Mode Disabled](#1-dark-mode-disabled)
2. [Contract Observations Field](#2-contract-observations-field)
3. [Vehicles Table & Fleet Management](#3-vehicles-table--fleet-management)
4. [Contract Status Fix](#4-contract-status-fix)
5. [Vehicle Grid Display](#5-vehicle-grid-display)
6. [Supabase Storage for Photos](#6-supabase-storage-for-photos)

---

## 1. Dark Mode Disabled ✅

### Changes Made:
- **app.json**: Changed `userInterfaceStyle` from `"automatic"` to `"light"`
- **contexts/theme-context.tsx**: Force light theme by default, disabled theme switching
- **components/app-header.tsx**: Removed theme toggle button from header
- **components/bottom-tab-bar.tsx**: Fixed to always use light theme
- **components/fleetos-logo.tsx**: Removed dark mode detection
- **app/dark-mode-test.tsx**: Updated to reflect light-only theme

### Result:
The app now always uses light theme regardless of system settings.

---

## 2. Contract Observations Field ✅

### Database Migration:
Run this SQL in your Supabase SQL Editor:

```sql
-- Add observations field to contracts table
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS observations TEXT;

-- Create index for observations (for search)
CREATE INDEX IF NOT EXISTS contracts_observations_idx 
ON public.contracts USING gin(to_tsvector('greek', coalesce(observations, '')));

-- Update search vector to include observations
DROP INDEX IF EXISTS contracts_search_idx;

ALTER TABLE public.contracts 
DROP COLUMN IF EXISTS search_vector;

ALTER TABLE public.contracts
ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('greek', 
    coalesce(renter_full_name, '') || ' ' ||
    coalesce(car_license_plate, '') || ' ' ||
    coalesce(car_make_model, '') || ' ' ||
    coalesce(observations, '')
  )
) STORED;

CREATE INDEX contracts_search_idx ON public.contracts USING GIN (search_vector);
```

### Code Changes:
- **models/contract.interface.ts**: Added `observations?: string` field
- **models/database.types.ts**: Added `observations` to Row, Insert, and Update types
- **services/supabase-contract.service.ts**: 
  - Added observations to `mapSupabaseToContract()`
  - Added observations to `saveContract()`
  - Added observations to `updateContract()`

### Usage:
Now you can add notes/observations to any contract. The field is optional and will be included in full-text search.

---

## 3. Vehicles Table & Fleet Management ✅

### Database Migration:
Run this SQL in your Supabase SQL Editor:

```bash
# Full SQL file created at:
supabase/add-observations-and-vehicles.sql
```

Key features:
- Centralized vehicle registry
- KTEO (MOT) tracking with expiry dates
- Insurance information (type, expiry, company, policy number)
- Tire tracking (front & rear dates and brands)
- Vehicle status (available, rented, maintenance, retired)
- Maintenance notes

### New TypeScript Interfaces:
**models/vehicle.interface.ts**:
- `Vehicle`: Main vehicle interface
- `VehicleCategory`: car | atv | scooter | motorcycle | van | truck
- `VehicleStatus`: available | rented | maintenance | retired
- `VehicleDamageHistoryItem`: Damage history from contracts
- `VehicleSummary`: Complete vehicle overview

### New Service:
**services/vehicle.service.ts**:
Methods available:
- `getAllVehicles()`: Get all vehicles
- `getVehicleById(id)`: Get single vehicle
- `getVehicleByPlate(licensePlate)`: Find by license plate
- `createVehicle(vehicle)`: Add new vehicle
- `updateVehicle(id, updates)`: Update vehicle
- `deleteVehicle(id)`: Remove vehicle
- `getVehicleDamageHistory(licensePlate, limit)`: Get damage history
- `getVehicleSummary(licensePlate)`: Get complete vehicle info with contracts
- `getVehiclesWithExpiringDocuments(daysAhead)`: Get vehicles needing attention
- `searchVehicles(query)`: Search by plate/make/model

### Database Functions:
1. **get_vehicle_last_damages(p_license_plate, p_limit)**
   - Returns recent damages for a vehicle

2. **get_vehicle_summary(p_license_plate)**
   - Returns vehicle info, last contract, total contracts, total damages, and recent damages

---

## 4. Contract Status Fix (TODO)

### Problem:
Contracts show as "completed" even if the dropoff is at 17:00 today, because the logic only checks the date, not the time.

### Solution:
Update the `calculateStatus()` function in `services/supabase-contract.service.ts`:

```typescript
private static calculateStatus(pickupDate: string, dropoffDate: string, pickupTime?: string, dropoffTime?: string): 'active' | 'completed' | 'upcoming' {
  const now = new Date();
  
  // Parse pickup datetime
  const pickup = new Date(pickupDate);
  if (pickupTime) {
    const [hours, minutes] = pickupTime.split(':');
    pickup.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  
  // Parse dropoff datetime
  const dropoff = new Date(dropoffDate);
  if (dropoffTime) {
    const [hours, minutes] = dropoffTime.split(':');
    dropoff.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  
  if (now < pickup) {
    return 'upcoming';
  } else if (now >= pickup && now <= dropoff) {
    return 'active';
  } else {
    return 'completed';
  }
}
```

Then update the call to include times:
```typescript
const status = this.calculateStatus(
  data.pickup_date, 
  data.dropoff_date,
  data.pickup_time,
  data.dropoff_time
);
```

---

## 5. Vehicle Grid Display (TODO)

Currently vehicles are shown in a list. Need to change to a grid layout with cards.

### Location to Update:
**app/(tabs)/cars.tsx** or similar vehicles list page

### Design:
Each card should display:
- Vehicle image (placeholder if none)
- Make & Model (large, bold)
- License Plate (below make/model)
- Status badge (Available, Rented, Maintenance)
- Quick stats (Total contracts, Last rental date)

### Example Structure:
```typescript
<FlatList
  data={vehicles}
  numColumns={2}
  renderItem={({ item }) => (
    <VehicleCard
      vehicle={item}
      onPress={() => navigateToVehicleDetails(item.id)}
    />
  )}
  contentContainerStyle={styles.grid}
/>
```

---

## 6. Supabase Storage for Photos (TODO)

### Current State:
Photos might be stored locally or in different ways.

### Target State:
All damage photos should be stored in Supabase Storage buckets.

### Implementation Steps:

1. **Create Storage Buckets** (run in Supabase SQL Editor):
```sql
-- Create bucket for contract photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contract-photos', 'contract-photos', true)
ON CONFLICT DO NOTHING;

-- Create bucket for damage photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('damage-photos', 'damage-photos', true)
ON CONFLICT DO NOTHING;

-- Storage policies for contract photos
CREATE POLICY "Authenticated users can upload contract photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contract-photos');

CREATE POLICY "Authenticated users can view contract photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'contract-photos');

-- Storage policies for damage photos
CREATE POLICY "Authenticated users can upload damage photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'damage-photos');

CREATE POLICY "Authenticated users can view damage photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'damage-photos');
```

2. **Create Photo Upload Service**:
```typescript
// services/photo-storage.service.ts
export class PhotoStorageService {
  static async uploadContractPhoto(
    contractId: string,
    photoUri: string,
    index: number
  ): Promise<string> {
    // Convert photo to blob
    const response = await fetch(photoUri);
    const blob = await response.blob();
    
    // Generate unique filename
    const fileName = `${contractId}/photo_${index}_${Date.now()}.jpg`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('contract-photos')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('contract-photos')
      .getPublicUrl(fileName);
    
    return publicUrl;
  }
  
  static async uploadDamagePhoto(
    damageId: string,
    photoUri: string
  ): Promise<string> {
    const response = await fetch(photoUri);
    const blob = await response.blob();
    
    const fileName = `${damageId}_${Date.now()}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('damage-photos')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('damage-photos')
      .getPublicUrl(fileName);
    
    return publicUrl;
  }
}
```

3. **Update Photo Capture Component**:
In `components/photo-capture.tsx`, after capturing photo:
```typescript
const publicUrl = await PhotoStorageService.uploadContractPhoto(
  contractId,
  photo.uri,
  photoIndex
);

// Save URL to photos table
await supabase
  .from('photos')
  .insert({
    contract_id: contractId,
    photo_url: publicUrl,
    storage_path: fileName,
    order_index: photoIndex
  });
```

---

## 7. Auto-populate Vehicle Data in New Contract (TODO)

### Location:
**app/new-contract.tsx**

### Implementation:
When user selects or types a license plate:
1. Check if vehicle exists in vehicles table
2. If found, auto-fill:
   - Make/Model
   - Year
   - Category
   - Color
3. Load last damages from vehicle_damage_history
4. Display damages on car diagram automatically

### Code Example:
```typescript
const handleLicensePlateChange = async (plate: string) => {
  setLicensePlate(plate);
  
  // Search for vehicle
  const vehicle = await VehicleService.getVehicleByPlate(plate);
  
  if (vehicle) {
    // Auto-fill vehicle info
    setMake(vehicle.make);
    setModel(vehicle.model);
    setYear(vehicle.year);
    setCategory(vehicle.category);
    setColor(vehicle.color);
    setCurrentMileage(vehicle.currentMileage);
    
    // Load last damages
    const damages = await VehicleService.getVehicleDamageHistory(plate, 20);
    setExistingDamages(damages);
    
    // Show alert
    Alert.alert(
      'Όχημα Βρέθηκε',
      `Βρέθηκαν ${damages.length} προηγούμενες ζημιές για αυτό το όχημα.`,
      [{ text: 'OK' }]
    );
  }
};
```

---

## Next Steps

### Priority 1 (Critical):
1. ✅ Add observations field
2. ✅ Create vehicles table and service
3. Run SQL migration in Supabase
4. Fix contract status logic (time-aware)
5. Fix add new car functionality

### Priority 2 (High):
6. Update vehicle details page with KTEO, insurance, tires
7. Implement vehicle grid display
8. Auto-populate vehicle data in new contracts

### Priority 3 (Medium):
9. Migrate photos to Supabase Storage
10. Create vehicle maintenance reminders
11. Add vehicle availability calendar

---

## Testing Checklist

After running migrations:
- [ ] Can add observations to contracts
- [ ] Observations appear in search results
- [ ] Can create new vehicles with all fields
- [ ] Can view vehicle damage history
- [ ] KTEO and insurance dates display correctly
- [ ] Tire information saves and displays
- [ ] Contract status considers time, not just date
- [ ] Photos upload to Supabase Storage
- [ ] License plate auto-fills vehicle data
- [ ] Vehicle grid displays correctly

---

## SQL Migration Files

1. **supabase/add-observations-and-vehicles.sql**
   - Adds observations field to contracts
   - Creates vehicles table
   - Creates vehicle damage history view
   - Creates helper functions

Run in order:
```bash
# In Supabase SQL Editor, run:
supabase/add-observations-and-vehicles.sql
```

---

## Support

If you encounter any issues:
1. Check Supabase logs for RLS policy errors
2. Verify all migrations ran successfully
3. Check TypeScript types match database schema
4. Verify Supabase Storage buckets were created

## Notes

- All dates are stored in ISO format in the database
- Greek language support is built into search vectors
- RLS policies ensure users only see their own data
- Storage buckets are configured as public for easy access

