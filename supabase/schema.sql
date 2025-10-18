-- ==============================================
-- Supabase Database Schema for Car Rental App
-- ==============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- USERS TABLE (Staff/Employees)
-- ==============================================
-- This table extends Supabase auth.users with additional profile info
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  signature_url TEXT, -- URL to signature image in storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read all user profiles
CREATE POLICY "Users can view all profiles"
  ON public.users
  FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ==============================================
-- CONTRACTS TABLE
-- ==============================================
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  
  -- Renter Information
  renter_full_name TEXT NOT NULL,
  renter_id_number TEXT NOT NULL,
  renter_tax_id TEXT NOT NULL, -- ΑΦΜ
  renter_driver_license_number TEXT NOT NULL,
  renter_phone_number TEXT NOT NULL,
  renter_email TEXT,
  renter_address TEXT NOT NULL,
  
  -- Rental Period
  pickup_date TIMESTAMP WITH TIME ZONE NOT NULL,
  pickup_time TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  dropoff_date TIMESTAMP WITH TIME ZONE NOT NULL,
  dropoff_time TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  is_different_dropoff_location BOOLEAN DEFAULT false,
  total_cost DECIMAL(10, 2) NOT NULL,
  
  -- Car Information
  car_make_model TEXT NOT NULL,
  car_year INTEGER NOT NULL,
  car_license_plate TEXT NOT NULL,
  car_mileage INTEGER NOT NULL,
  
  -- Car Condition
  fuel_level INTEGER NOT NULL CHECK (fuel_level >= 1 AND fuel_level <= 8),
  insurance_type TEXT NOT NULL CHECK (insurance_type IN ('basic', 'full')),
  
  -- Signatures
  client_signature_url TEXT, -- URL to client signature in storage
  
  -- AADE Integration
  aade_dcl_id INTEGER, -- AADE Digital Client ID
  aade_submitted_at TIMESTAMP WITH TIME ZONE,
  aade_updated_at TIMESTAMP WITH TIME ZONE,
  aade_invoice_mark TEXT, -- Invoice MARK for correlation
  aade_status TEXT CHECK (aade_status IN ('pending', 'submitted', 'completed', 'cancelled', 'error')),
  aade_error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('greek', 
      coalesce(renter_full_name, '') || ' ' ||
      coalesce(car_license_plate, '') || ' ' ||
      coalesce(car_make_model, '')
    )
  ) STORED
);

-- Enable Row Level Security
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view all contracts
CREATE POLICY "Authenticated users can view contracts"
  ON public.contracts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- All authenticated users can insert contracts
CREATE POLICY "Authenticated users can insert contracts"
  ON public.contracts
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own contracts
CREATE POLICY "Users can update own contracts"
  ON public.contracts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own contracts
CREATE POLICY "Users can delete own contracts"
  ON public.contracts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for search
CREATE INDEX contracts_search_idx ON public.contracts USING GIN (search_vector);
CREATE INDEX contracts_user_id_idx ON public.contracts (user_id);
CREATE INDEX contracts_pickup_date_idx ON public.contracts (pickup_date DESC);
CREATE INDEX contracts_car_license_plate_idx ON public.contracts (car_license_plate);

-- ==============================================
-- DAMAGE POINTS TABLE
-- ==============================================
CREATE TABLE public.damage_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  
  -- Position on car diagram
  x_position DECIMAL(5, 2) NOT NULL CHECK (x_position >= 0 AND x_position <= 100), -- percentage
  y_position DECIMAL(5, 2) NOT NULL CHECK (y_position >= 0 AND y_position <= 100), -- percentage
  view_side TEXT NOT NULL CHECK (view_side IN ('front', 'rear', 'left', 'right')),
  
  -- Damage details
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.damage_points ENABLE ROW LEVEL SECURITY;

-- Damage points inherit permissions from contracts
CREATE POLICY "Users can view damage points for visible contracts"
  ON public.damage_points
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = damage_points.contract_id
    )
  );

CREATE POLICY "Users can insert damage points for their contracts"
  ON public.damage_points
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = damage_points.contract_id
      AND contracts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update damage points for their contracts"
  ON public.damage_points
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = damage_points.contract_id
      AND contracts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete damage points for their contracts"
  ON public.damage_points
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = damage_points.contract_id
      AND contracts.user_id = auth.uid()
    )
  );

CREATE INDEX damage_points_contract_id_idx ON public.damage_points (contract_id);

-- ==============================================
-- PHOTOS TABLE
-- ==============================================
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  
  -- Storage information
  photo_url TEXT NOT NULL, -- URL to photo in Supabase Storage
  storage_path TEXT NOT NULL, -- Path in storage bucket
  
  -- Metadata
  file_size INTEGER, -- bytes
  mime_type TEXT,
  order_index INTEGER DEFAULT 0, -- for ordering photos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Photos inherit permissions from contracts
CREATE POLICY "Users can view photos for visible contracts"
  ON public.photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = photos.contract_id
    )
  );

CREATE POLICY "Users can insert photos for their contracts"
  ON public.photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = photos.contract_id
      AND contracts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update photos for their contracts"
  ON public.photos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = photos.contract_id
      AND contracts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos for their contracts"
  ON public.photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = photos.contract_id
      AND contracts.user_id = auth.uid()
    )
  );

CREATE INDEX photos_contract_id_idx ON public.photos (contract_id);

-- ==============================================
-- FUNCTIONS
-- ==============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- VIEWS
-- ==============================================

-- View for contract summary (for listing contracts)
CREATE VIEW public.contracts_summary AS
SELECT 
  c.id,
  c.user_id,
  u.name as user_name,
  c.renter_full_name,
  c.renter_phone_number,
  c.car_make_model,
  c.car_license_plate,
  c.pickup_date,
  c.dropoff_date,
  c.total_cost,
  c.created_at,
  COUNT(DISTINCT dp.id) as damage_count,
  COUNT(DISTINCT p.id) as photo_count
FROM public.contracts c
LEFT JOIN public.users u ON c.user_id = u.id
LEFT JOIN public.damage_points dp ON c.id = dp.contract_id
LEFT JOIN public.photos p ON c.id = p.contract_id
GROUP BY c.id, u.name;

-- ==============================================
-- STORAGE BUCKETS SETUP
-- ==============================================
-- Run these commands in Supabase Storage dashboard or via SQL:

-- 1. Create storage bucket for contract photos
-- INSERT INTO storage.buckets (id, name, public) VALUES ('contract-photos', 'contract-photos', true);

-- 2. Create storage bucket for signatures
-- INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', false);

-- Storage policies will be created via the Supabase dashboard or API

-- ==============================================
-- SAMPLE DATA (for testing)
-- ==============================================

-- This will be populated when users sign up through your app
-- Example:
-- INSERT INTO public.users (id, name, signature_url) VALUES
-- (auth.uid(), 'Διαχειριστής', null);

