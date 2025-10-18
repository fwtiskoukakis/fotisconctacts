-- ==============================================
-- QUICK FIX FOR EXISTING DATABASE
-- ==============================================
-- Run this if you already have tables and need to fix the car_id issue

-- Drop the car_id column if it exists
ALTER TABLE public.contracts DROP COLUMN IF EXISTS car_id;

-- Drop the car_id index if it exists
DROP INDEX IF EXISTS contracts_car_id_idx;

-- Add any missing columns that might not exist
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS renter_name TEXT,
ADD COLUMN IF NOT EXISTS renter_email TEXT,
ADD COLUMN IF NOT EXISTS renter_phone TEXT,
ADD COLUMN IF NOT EXISTS renter_address TEXT,
ADD COLUMN IF NOT EXISTS renter_id_number TEXT,
ADD COLUMN IF NOT EXISTS renter_driving_license TEXT,
ADD COLUMN IF NOT EXISTS pickup_date DATE,
ADD COLUMN IF NOT EXISTS pickup_time TIME,
ADD COLUMN IF NOT EXISTS pickup_location TEXT,
ADD COLUMN IF NOT EXISTS dropoff_date DATE,
ADD COLUMN IF NOT EXISTS dropoff_time TIME,
ADD COLUMN IF NOT EXISTS dropoff_location TEXT,
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS car_make TEXT,
ADD COLUMN IF NOT EXISTS car_model TEXT,
ADD COLUMN IF NOT EXISTS car_license_plate TEXT,
ADD COLUMN IF NOT EXISTS car_color TEXT,
ADD COLUMN IF NOT EXISTS fuel_level INTEGER DEFAULT 8 CHECK (fuel_level >= 0 AND fuel_level <= 8),
ADD COLUMN IF NOT EXISTS mileage_start INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mileage_end INTEGER,
ADD COLUMN IF NOT EXISTS condition_notes TEXT,
ADD COLUMN IF NOT EXISTS aade_dcl_id INTEGER,
ADD COLUMN IF NOT EXISTS aade_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS aade_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS aade_invoice_mark TEXT,
ADD COLUMN IF NOT EXISTS aade_status TEXT CHECK (aade_status IN ('pending', 'submitted', 'completed', 'cancelled', 'error')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS aade_error_message TEXT,
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS public.damage_points (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK (severity IN ('minor', 'major', 'critical')) DEFAULT 'minor',
    estimated_cost DECIMAL(10,2) DEFAULT 0,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contract_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    photo_url TEXT NOT NULL,
    photo_type TEXT CHECK (photo_type IN ('pickup', 'dropoff', 'damage', 'general')) DEFAULT 'general',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('return_reminder', 'fuel_low', 'payment_due', 'damage_alert', 'system')) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    scheduled_for TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS if not already enabled
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damage_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS contracts_user_id_idx ON public.contracts (user_id);
CREATE INDEX IF NOT EXISTS contracts_pickup_date_idx ON public.contracts (pickup_date);
CREATE INDEX IF NOT EXISTS contracts_status_idx ON public.contracts (status);
CREATE INDEX IF NOT EXISTS contracts_aade_status_idx ON public.contracts (aade_status);
CREATE INDEX IF NOT EXISTS contracts_aade_dcl_id_idx ON public.contracts (aade_dcl_id);
CREATE INDEX IF NOT EXISTS damage_points_contract_id_idx ON public.damage_points (contract_id);
CREATE INDEX IF NOT EXISTS contract_photos_contract_id_idx ON public.contract_photos (contract_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications (is_read);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON public.notifications (type);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database fix completed successfully!';
    RAISE NOTICE '🔧 Removed car_id column and fixed schema';
    RAISE NOTICE '📊 Added missing tables and indexes';
    RAISE NOTICE '🚀 Ready to use!';
END $$;
