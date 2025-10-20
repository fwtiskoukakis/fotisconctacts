-- ==============================================
-- COMPREHENSIVE CONTRACTS TABLE MIGRATION
-- Ensures ALL fields needed for contract sync exist
-- ==============================================

-- Add missing fields to contracts table
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS insurance_cost NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS car_category TEXT,
ADD COLUMN IF NOT EXISTS car_color TEXT,
ADD COLUMN IF NOT EXISTS exterior_condition TEXT,
ADD COLUMN IF NOT EXISTS interior_condition TEXT,
ADD COLUMN IF NOT EXISTS mechanical_condition TEXT,
ADD COLUMN IF NOT EXISTS condition_notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create or replace update trigger for updated_at
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contracts_updated_at_trigger ON public.contracts;
CREATE TRIGGER update_contracts_updated_at_trigger
    BEFORE UPDATE ON public.contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_contracts_updated_at();

-- Add column comments for documentation
COMMENT ON COLUMN public.contracts.deposit_amount IS 'Deposit amount paid by renter';
COMMENT ON COLUMN public.contracts.insurance_cost IS 'Insurance cost for the rental period';
COMMENT ON COLUMN public.contracts.car_category IS 'Vehicle category (car, atv, scooter, motorcycle)';
COMMENT ON COLUMN public.contracts.car_color IS 'Vehicle color';
COMMENT ON COLUMN public.contracts.exterior_condition IS 'Exterior condition at pickup';
COMMENT ON COLUMN public.contracts.interior_condition IS 'Interior condition at pickup';
COMMENT ON COLUMN public.contracts.mechanical_condition IS 'Mechanical condition at pickup';
COMMENT ON COLUMN public.contracts.condition_notes IS 'Additional notes about vehicle condition';
COMMENT ON COLUMN public.contracts.updated_at IS 'Timestamp of last update';

-- Verification
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'contracts'
    AND column_name IN (
        'deposit_amount', 'insurance_cost', 'car_category', 'car_color',
        'exterior_condition', 'interior_condition', 'mechanical_condition',
        'condition_notes', 'updated_at'
    );
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ Contracts table migration completed!';
    RAISE NOTICE '📊 Found % out of 9 expected columns', column_count;
    RAISE NOTICE '🔄 Updated_at trigger configured';
    RAISE NOTICE '🚀 All contract fields ready for sync!';
    RAISE NOTICE '============================================';
    
    IF column_count < 9 THEN
        RAISE WARNING '⚠️  Some columns may be missing. Expected 9, found %', column_count;
    END IF;
END $$;

