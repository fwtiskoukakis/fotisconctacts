-- Add marker_type column to damage_points table
-- This supports different damage marker types: slight-scratch, heavy-scratch, bent, broken

-- Add the column if it doesn't exist
ALTER TABLE public.damage_points 
ADD COLUMN IF NOT EXISTS marker_type TEXT DEFAULT 'slight-scratch';

-- Add a check constraint to ensure valid values
ALTER TABLE public.damage_points 
DROP CONSTRAINT IF EXISTS damage_points_marker_type_check;

ALTER TABLE public.damage_points 
ADD CONSTRAINT damage_points_marker_type_check 
CHECK (marker_type IN ('slight-scratch', 'heavy-scratch', 'bent', 'broken'));

-- Add comment for documentation
COMMENT ON COLUMN public.damage_points.marker_type IS 'Type of damage marker: slight-scratch, heavy-scratch, bent, or broken';

-- Update existing rows to have default value
UPDATE public.damage_points 
SET marker_type = 'slight-scratch' 
WHERE marker_type IS NULL;

-- Verify the column was added
DO $$
BEGIN
    RAISE NOTICE '✅ marker_type column added to damage_points table successfully!';
    RAISE NOTICE '📊 Valid values: slight-scratch, heavy-scratch, bent, broken';
    RAISE NOTICE '🔧 Default value: slight-scratch';
END $$;

