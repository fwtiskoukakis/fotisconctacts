-- ============================================
-- Enhance CARS table with VEHICLES table features
-- Merges KTEO, Insurance, Tires into existing cars table
-- ============================================

-- Add KTEO fields
ALTER TABLE public.cars 
  ADD COLUMN IF NOT EXISTS kteo_last_date DATE,
  ADD COLUMN IF NOT EXISTS kteo_expiry_date DATE;

-- Add Insurance fields
ALTER TABLE public.cars 
  ADD COLUMN IF NOT EXISTS insurance_type TEXT,
  ADD COLUMN IF NOT EXISTS insurance_company TEXT,
  ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT,
  ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE;

-- Add Tire fields
ALTER TABLE public.cars 
  ADD COLUMN IF NOT EXISTS tires_front_date DATE,
  ADD COLUMN IF NOT EXISTS tires_front_brand TEXT,
  ADD COLUMN IF NOT EXISTS tires_rear_date DATE,
  ADD COLUMN IF NOT EXISTS tires_rear_brand TEXT;

-- Add Notes field
ALTER TABLE public.cars 
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add current_mileage (different from mileage which might be initial)
-- Update: Just use existing fields, no need for current_mileage

-- Add user_id if it doesn't exist (for multi-user support)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cars' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.cars ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS cars_kteo_expiry_idx ON public.cars(kteo_expiry_date);
CREATE INDEX IF NOT EXISTS cars_insurance_expiry_idx ON public.cars(insurance_expiry_date);
CREATE INDEX IF NOT EXISTS cars_user_id_idx ON public.cars(user_id);

-- Add constraint for insurance_type if not exists (should accept 'basic' or 'full')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'cars_insurance_type_check'
  ) THEN
    ALTER TABLE public.cars 
      ADD CONSTRAINT cars_insurance_type_check 
      CHECK (insurance_type IS NULL OR insurance_type IN ('basic', 'full'));
  END IF;
END $$;

-- Update status constraint to include all vehicle statuses
DO $$
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'cars_status_check'
  ) THEN
    ALTER TABLE public.cars DROP CONSTRAINT cars_status_check;
  END IF;
  
  -- Add new constraint
  ALTER TABLE public.cars 
    ADD CONSTRAINT cars_status_check 
    CHECK (status IS NULL OR status IN ('available', 'rented', 'maintenance', 'retired'));
END $$;

-- Create search vector if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cars' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE public.cars 
      ADD COLUMN search_vector tsvector 
      GENERATED ALWAYS AS (
        to_tsvector('greek'::regconfig, 
          COALESCE(license_plate, '') || ' ' ||
          COALESCE(make, '') || ' ' ||
          COALESCE(model, '') || ' ' ||
          COALESCE(notes, '')
        )
      ) STORED;
    
    CREATE INDEX IF NOT EXISTS cars_search_idx ON public.cars USING gin(search_vector);
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE public.cars IS 'Enhanced cars table with KTEO, insurance, tire tracking, and notes';

-- Show summary
SELECT 
  'Cars table enhanced successfully!' as status,
  COUNT(*) as total_cars
FROM public.cars;

