# Database Schema Mappings

This document shows the correct mappings between database columns and TypeScript interfaces.

## 🚗 Cars Table

### Database Schema
```sql
create table public.cars (
  id uuid PRIMARY KEY,
  make text NOT NULL,
  model text NOT NULL,
  make_model text GENERATED ALWAYS AS (make || ' ' || model) STORED,
  year integer,
  license_plate text NOT NULL UNIQUE,
  color text,
  fuel_type text DEFAULT 'gasoline',
  transmission text DEFAULT 'manual',
  seats integer DEFAULT 5,
  daily_rate numeric(10, 2) DEFAULT 0,
  is_available boolean DEFAULT true,
  photo_url text,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW(),
  description text,
  features text,
  images text[],
  agency text,
  island text,
  category text,
  status text DEFAULT 'available',
  type text DEFAULT 'Car'
)
```

### TypeScript Mapping
```typescript
interface Car {
  id: string;                    // id (uuid)
  make: string;                  // make
  model: string;                 // model
  makeModel: string;             // make_model (generated)
  year?: number;                 // year
  licensePlate: string;          // license_plate
  color?: string;                // color
  fuelType: string;              // fuel_type
  transmission: string;          // transmission
  seats: number;                 // seats
  dailyRate: number;             // daily_rate
  isAvailable: boolean;          // is_available
  photoUrl?: string;             // photo_url
  description?: string;          // description
  features?: string;             // features
  images?: string[];             // images (array)
  agency?: string;               // agency
  island?: string;               // island
  category?: string;             // category
  status?: string;               // status
  type?: string;                 // type
  createdAt: string;             // created_at
  updatedAt: string;             // updated_at
}
```

## 📄 Contracts Table

### Database Schema
```sql
create table public.contracts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  
  -- Renter Information
  renter_full_name text NOT NULL,
  renter_id_number text NOT NULL,
  renter_tax_id text NOT NULL,
  renter_driver_license_number text NOT NULL,
  renter_phone_number text NOT NULL,
  renter_email text,
  renter_address text NOT NULL,
  
  -- Rental Period
  pickup_date timestamp with time zone NOT NULL,
  pickup_time text NOT NULL,
  pickup_location text NOT NULL,
  dropoff_date timestamp with time zone NOT NULL,
  dropoff_time text NOT NULL,
  dropoff_location text NOT NULL,
  is_different_dropoff_location boolean DEFAULT false,
  total_cost numeric(10, 2) NOT NULL,
  
  -- Car Information
  car_make_model text NOT NULL,
  car_year integer NOT NULL,
  car_license_plate text NOT NULL,
  car_mileage integer NOT NULL,
  
  -- Car Condition
  fuel_level integer NOT NULL CHECK (fuel_level >= 1 AND fuel_level <= 8),
  insurance_type text NOT NULL CHECK (insurance_type IN ('basic', 'full')),
  
  -- Signatures
  client_signature_url text,
  
  -- AADE Integration
  aade_dcl_id integer,
  aade_submitted_at timestamp with time zone,
  aade_updated_at timestamp with time zone,
  aade_invoice_mark text,
  aade_status text CHECK (aade_status IN ('pending', 'submitted', 'completed', 'cancelled', 'error')),
  aade_error_message text,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
)
```

### TypeScript Mapping
```typescript
interface Contract {
  id: string;                        // id (uuid)
  userId: string;                    // user_id
  
  // Renter Information
  renterFullName: string;            // renter_full_name
  renterIdNumber: string;            // renter_id_number
  renterTaxId: string;               // renter_tax_id
  renterDriverLicenseNumber: string; // renter_driver_license_number
  renterPhoneNumber: string;         // renter_phone_number
  renterEmail?: string;              // renter_email
  renterAddress: string;             // renter_address
  
  // Rental Period
  pickupDate: string;                // pickup_date
  pickupTime: string;                // pickup_time
  pickupLocation: string;            // pickup_location
  dropoffDate: string;               // dropoff_date
  dropoffTime: string;               // dropoff_time
  dropoffLocation: string;           // dropoff_location
  isDifferentDropoffLocation: boolean; // is_different_dropoff_location
  totalCost: number;                 // total_cost
  
  // Car Information
  carMakeModel: string;              // car_make_model
  carYear: number;                   // car_year
  carLicensePlate: string;           // car_license_plate
  carMileage: number;                // car_mileage
  
  // Car Condition
  fuelLevel: number;                 // fuel_level (1-8)
  insuranceType: 'basic' | 'full';   // insurance_type
  
  // Signatures
  clientSignatureUrl?: string;       // client_signature_url
  
  // AADE Integration
  aadeDclId?: number;                // aade_dcl_id
  aadeSubmittedAt?: string;          // aade_submitted_at
  aadeUpdatedAt?: string;            // aade_updated_at
  aadeInvoiceMark?: string;          // aade_invoice_mark
  aadeStatus?: string;               // aade_status
  aadeErrorMessage?: string;         // aade_error_message
  
  // Metadata
  createdAt: string;                 // created_at
  updatedAt: string;                 // updated_at
}
```

**NOTE:** The contracts table does NOT have a `status` field. Contract status is determined by comparing dates:
- **Active**: `pickup_date <= NOW() <= dropoff_date`
- **Completed**: `NOW() > dropoff_date`
- **Upcoming**: `NOW() < pickup_date`

## ⚠️ Damage Points Table

### Database Schema
```sql
create table public.damage_points (
  id uuid PRIMARY KEY,
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  -- Position on car diagram
  x_position numeric(5, 2) NOT NULL CHECK (x_position >= 0 AND x_position <= 100),
  y_position numeric(5, 2) NOT NULL CHECK (y_position >= 0 AND y_position <= 100),
  view_side text NOT NULL CHECK (view_side IN ('front', 'rear', 'left', 'right')),
  
  -- Damage details
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe')),
  
  -- Metadata
  created_at timestamp with time zone DEFAULT NOW()
)
```

### TypeScript Mapping
```typescript
interface DamagePoint {
  id: string;                                    // id (uuid)
  contractId: string;                            // contract_id
  xPosition: number;                             // x_position (0-100)
  yPosition: number;                             // y_position (0-100)
  viewSide: 'front' | 'rear' | 'left' | 'right'; // view_side
  description: string;                           // description
  severity: 'minor' | 'moderate' | 'severe';     // severity
  createdAt: string;                             // created_at
}
```

## 🔗 Relationships

### Car → Contracts
```typescript
// Query contracts for a specific car
const { data: contracts } = await supabase
  .from('contracts')
  .select('*')
  .eq('car_license_plate', car.licensePlate);
```

### Contract → Damage Points
```typescript
// Query damage points for a contract
const { data: damages } = await supabase
  .from('damage_points')
  .select('*')
  .eq('contract_id', contractId);
```

### Contract → Damage Points with Renter Name
```typescript
// Query damage points with renter information
const { data: damages } = await supabase
  .from('damage_points')
  .select('*, contracts!inner(renter_full_name)')
  .eq('contract_id', contractId);

// Access: damage.contracts.renter_full_name
```

## ✅ Key Points

1. **Always use snake_case** for database columns
2. **Always use camelCase** for TypeScript properties
3. **Generated columns** (like `make_model`) are read-only
4. **Array columns** (like `images`) use PostgreSQL array syntax: `text[]`
5. **Enum checks** use PostgreSQL CHECK constraints
6. **Foreign keys** use CASCADE on delete for damage_points
7. **No status field** in contracts - calculate from dates
8. **Timestamps** are always `timestamp with time zone`
9. **Numeric fields** use `numeric(precision, scale)` for decimals
10. **Boolean fields** use PostgreSQL `boolean` type

## 🔄 Common Queries

### Get car with all contracts and damages
```typescript
// 1. Get car
const { data: car } = await supabase
  .from('cars')
  .select('*')
  .eq('id', carId)
  .single();

// 2. Get contracts for this car
const { data: contracts } = await supabase
  .from('contracts')
  .select('*')
  .eq('car_license_plate', car.license_plate);

// 3. Get damages for these contracts
const contractIds = contracts.map(c => c.id);
const { data: damages } = await supabase
  .from('damage_points')
  .select('*, contracts!inner(renter_full_name)')
  .in('contract_id', contractIds);
```

### Calculate contract statistics
```typescript
function calculateStats(contracts: Contract[]) {
  const now = new Date();
  
  const active = contracts.filter(c => {
    const pickup = new Date(c.pickup_date);
    const dropoff = new Date(c.dropoff_date);
    return pickup <= now && now <= dropoff;
  });
  
  const completed = contracts.filter(c => {
    const dropoff = new Date(c.dropoff_date);
    return now > dropoff;
  });
  
  const upcoming = contracts.filter(c => {
    const pickup = new Date(c.pickup_date);
    return now < pickup;
  });
  
  return { active, completed, upcoming };
}
```

