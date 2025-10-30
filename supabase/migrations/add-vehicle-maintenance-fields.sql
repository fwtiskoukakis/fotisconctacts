-- ==============================================
-- Add Vehicle Maintenance Tracking Fields
-- ==============================================
-- Adds comprehensive maintenance tracking including:
-- - Service history (last service date and mileage, next service target)
-- - Tire maintenance (next recommended change date)
-- - Insurance mixed coverage flag

-- Add service tracking fields
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS last_service_date DATE,
ADD COLUMN IF NOT EXISTS last_service_mileage INTEGER,
ADD COLUMN IF NOT EXISTS next_service_mileage INTEGER;

-- Add tire next change tracking
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS tires_next_change_date DATE;

-- Add insurance mixed coverage flag
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS insurance_has_mixed_coverage BOOLEAN DEFAULT false;

-- Create indexes for sorting and filtering maintenance data
CREATE INDEX IF NOT EXISTS cars_last_service_date_idx ON public.cars (last_service_date);
CREATE INDEX IF NOT EXISTS cars_tires_next_change_idx ON public.cars (tires_next_change_date);
CREATE INDEX IF NOT EXISTS cars_next_service_mileage_idx ON public.cars (next_service_mileage);

-- Add comments for documentation
COMMENT ON COLUMN public.cars.last_service_date IS 'Date when the vehicle last received service';
COMMENT ON COLUMN public.cars.last_service_mileage IS 'Vehicle mileage at last service';
COMMENT ON COLUMN public.cars.next_service_mileage IS 'Recommended mileage for next service';
COMMENT ON COLUMN public.cars.tires_next_change_date IS 'Recommended date for next tire change';
COMMENT ON COLUMN public.cars.insurance_has_mixed_coverage IS 'Whether insurance includes mixed (commercial + personal) coverage';

COMMENT ON TABLE public.cars IS 'Central vehicle/car registry with maintenance and tracking information including service history, tire maintenance, KTEO, and insurance details';
