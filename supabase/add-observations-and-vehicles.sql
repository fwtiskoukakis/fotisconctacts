-- ==============================================
-- Add observations/notes field to contracts
-- ==============================================

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

-- ==============================================
-- VEHICLES TABLE
-- ==============================================
-- Centralized vehicle management with maintenance tracking

CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  
  -- Basic Vehicle Information
  license_plate TEXT NOT NULL UNIQUE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT,
  category TEXT CHECK (category IN ('car', 'atv', 'scooter', 'motorcycle', 'van', 'truck')),
  
  -- Current Status
  current_mileage INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'retired')),
  
  -- KTEO (MOT - Technical Inspection)
  kteo_last_date DATE,
  kteo_expiry_date DATE,
  
  -- Insurance Information
  insurance_type TEXT CHECK (insurance_type IN ('basic', 'full')),
  insurance_expiry_date DATE,
  insurance_company TEXT,
  insurance_policy_number TEXT,
  
  -- Tire Information
  tires_front_date DATE,
  tires_front_brand TEXT,
  tires_rear_date DATE,
  tires_rear_brand TEXT,
  
  -- Maintenance Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('greek', 
      coalesce(license_plate, '') || ' ' ||
      coalesce(make, '') || ' ' ||
      coalesce(model, '') || ' ' ||
      coalesce(notes, '')
    )
  ) STORED
);

-- Enable Row Level Security
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicles
CREATE POLICY "Users can view all vehicles"
  ON public.vehicles
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert vehicles"
  ON public.vehicles
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their vehicles"
  ON public.vehicles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their vehicles"
  ON public.vehicles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX vehicles_user_id_idx ON public.vehicles (user_id);
CREATE INDEX vehicles_license_plate_idx ON public.vehicles (license_plate);
CREATE INDEX vehicles_status_idx ON public.vehicles (status);
CREATE INDEX vehicles_search_idx ON public.vehicles USING GIN (search_vector);
CREATE INDEX vehicles_kteo_expiry_idx ON public.vehicles (kteo_expiry_date);
CREATE INDEX vehicles_insurance_expiry_idx ON public.vehicles (insurance_expiry_date);

-- Trigger for updated_at
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- VEHICLE DAMAGE HISTORY VIEW
-- ==============================================
-- Shows all damages for a vehicle across all contracts

CREATE OR REPLACE VIEW public.vehicle_damage_history AS
SELECT 
  c.car_license_plate,
  c.id as contract_id,
  c.pickup_date,
  c.dropoff_date,
  c.renter_full_name,
  dp.id as damage_id,
  dp.x_position,
  dp.y_position,
  dp.view_side,
  dp.description,
  dp.severity,
  dp.created_at as damage_reported_at
FROM public.contracts c
INNER JOIN public.damage_points dp ON c.id = dp.contract_id
ORDER BY c.car_license_plate, dp.created_at DESC;

-- ==============================================
-- FUNCTION: Get Vehicle Last Damages
-- ==============================================
-- Returns the most recent damages for a vehicle

CREATE OR REPLACE FUNCTION get_vehicle_last_damages(
  p_license_plate TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  damage_id UUID,
  contract_id UUID,
  contract_date TIMESTAMP WITH TIME ZONE,
  renter_name TEXT,
  x_position DECIMAL,
  y_position DECIMAL,
  view_side TEXT,
  description TEXT,
  severity TEXT,
  damage_reported_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.id,
    c.id,
    c.pickup_date,
    c.renter_full_name,
    dp.x_position,
    dp.y_position,
    dp.view_side,
    dp.description,
    dp.severity,
    dp.created_at
  FROM public.damage_points dp
  INNER JOIN public.contracts c ON dp.contract_id = c.id
  WHERE c.car_license_plate = p_license_plate
  ORDER BY dp.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- FUNCTION: Get Vehicle Summary
-- ==============================================
-- Returns vehicle info with latest contract details

CREATE OR REPLACE FUNCTION get_vehicle_summary(p_license_plate TEXT)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'vehicle', (
      SELECT row_to_json(v.*) 
      FROM public.vehicles v 
      WHERE v.license_plate = p_license_plate
    ),
    'last_contract', (
      SELECT row_to_json(c.*)
      FROM public.contracts c
      WHERE c.car_license_plate = p_license_plate
      ORDER BY c.pickup_date DESC
      LIMIT 1
    ),
    'total_contracts', (
      SELECT COUNT(*)
      FROM public.contracts
      WHERE car_license_plate = p_license_plate
    ),
    'total_damages', (
      SELECT COUNT(dp.id)
      FROM public.contracts c
      INNER JOIN public.damage_points dp ON c.id = dp.contract_id
      WHERE c.car_license_plate = p_license_plate
    ),
    'recent_damages', (
      SELECT json_agg(damages)
      FROM (
        SELECT dp.*, c.pickup_date, c.renter_full_name
        FROM public.damage_points dp
        INNER JOIN public.contracts c ON dp.contract_id = c.id
        WHERE c.car_license_plate = p_license_plate
        ORDER BY dp.created_at DESC
        LIMIT 5
      ) damages
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.vehicles IS 'Central vehicle registry with maintenance and tracking information';
COMMENT ON COLUMN public.contracts.observations IS 'Additional notes and observations about the rental contract';

