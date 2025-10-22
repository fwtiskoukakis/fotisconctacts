-- ============================================
-- Drop VEHICLES table safely
-- Run this AFTER running enhance-cars-table.sql
-- Run this ONLY if you've confirmed cars table has all data
-- ============================================

-- First, verify cars table has the new columns
DO $$
DECLARE
  missing_columns TEXT[];
BEGIN
  SELECT ARRAY_AGG(column_name)
  INTO missing_columns
  FROM (
    VALUES 
      ('kteo_last_date'),
      ('kteo_expiry_date'),
      ('insurance_company'),
      ('insurance_policy_number'),
      ('insurance_expiry_date'),
      ('tires_front_date'),
      ('tires_front_brand'),
      ('tires_rear_date'),
      ('tires_rear_brand'),
      ('notes')
  ) AS required_columns(column_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'cars'
      AND table_schema = 'public'
      AND column_name = required_columns.column_name
  );

  IF missing_columns IS NOT NULL AND array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Cannot drop vehicles table! Missing columns in cars table: %', missing_columns;
  END IF;
  
  RAISE NOTICE 'All required columns exist in cars table. Safe to proceed.';
END $$;

-- Drop foreign key constraints that reference vehicles table
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT 
      tc.constraint_name,
      tc.table_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE ccu.table_name = 'vehicles'
      AND tc.constraint_type = 'FOREIGN KEY'
  ) LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I CASCADE', 
      r.table_name, r.constraint_name);
    RAISE NOTICE 'Dropped constraint % from %', r.constraint_name, r.table_name;
  END LOOP;
END $$;

-- Drop indexes on vehicles table
DROP INDEX IF EXISTS public.vehicles_user_id_idx;
DROP INDEX IF EXISTS public.vehicles_license_plate_idx;
DROP INDEX IF EXISTS public.vehicles_status_idx;
DROP INDEX IF EXISTS public.vehicles_search_idx;
DROP INDEX IF EXISTS public.vehicles_kteo_expiry_idx;
DROP INDEX IF EXISTS public.vehicles_insurance_expiry_idx;

-- Drop the trigger
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can insert their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can delete their own vehicles" ON public.vehicles;

-- Finally, drop the table
DROP TABLE IF EXISTS public.vehicles CASCADE;

-- Confirm deletion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'vehicles' AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ Vehicles table successfully dropped!';
  ELSE
    RAISE WARNING '⚠️ Vehicles table still exists!';
  END IF;
END $$;

SELECT 
  'Vehicles table dropped successfully!' as status,
  COUNT(*) as total_cars_remaining
FROM public.cars;

