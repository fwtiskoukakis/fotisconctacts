-- Create photo storage tables for base64 storage
-- This replaces the previous Supabase Storage approach

-- Contract photos table
CREATE TABLE IF NOT EXISTS contract_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  photo_data TEXT NOT NULL, -- Base64 encoded photo data
  order_index INTEGER NOT NULL DEFAULT 0,
  file_size INTEGER NOT NULL DEFAULT 0,
  mime_type VARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Car photos table
CREATE TABLE IF NOT EXISTS car_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id VARCHAR(50) NOT NULL, -- License plate or vehicle ID
  photo_data TEXT NOT NULL, -- Base64 encoded photo data
  photo_type VARCHAR(50) NOT NULL DEFAULT 'general', -- exterior, interior, damage, etc
  file_size INTEGER NOT NULL DEFAULT 0,
  mime_type VARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Damage photos table
CREATE TABLE IF NOT EXISTS damage_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id VARCHAR(50) NOT NULL, -- License plate or vehicle ID
  damage_id UUID NOT NULL, -- Reference to damage point
  photo_data TEXT NOT NULL, -- Base64 encoded photo data
  file_size INTEGER NOT NULL DEFAULT 0,
  mime_type VARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Signatures table
CREATE TABLE IF NOT EXISTS signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signature_data TEXT NOT NULL, -- Base64 encoded signature data
  signature_type VARCHAR(20) NOT NULL DEFAULT 'client', -- user, client
  file_size INTEGER NOT NULL DEFAULT 0,
  mime_type VARCHAR(50) NOT NULL DEFAULT 'image/png',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contract_photos_contract_id ON contract_photos(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_photos_order ON contract_photos(contract_id, order_index);
CREATE INDEX IF NOT EXISTS idx_car_photos_vehicle_id ON car_photos(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_damage_photos_vehicle_id ON damage_photos(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_damage_photos_damage_id ON damage_photos(damage_id);
CREATE INDEX IF NOT EXISTS idx_signatures_user_id ON signatures(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE contract_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contract_photos
CREATE POLICY "Users can view their own contract photos" ON contract_photos
  FOR SELECT USING (
    contract_id IN (
      SELECT id FROM contracts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own contract photos" ON contract_photos
  FOR INSERT WITH CHECK (
    contract_id IN (
      SELECT id FROM contracts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own contract photos" ON contract_photos
  FOR UPDATE USING (
    contract_id IN (
      SELECT id FROM contracts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own contract photos" ON contract_photos
  FOR DELETE USING (
    contract_id IN (
      SELECT id FROM contracts WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for car_photos
CREATE POLICY "Users can view their own car photos" ON car_photos
  FOR SELECT USING (
    vehicle_id IN (
      SELECT license_plate FROM cars WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own car photos" ON car_photos
  FOR INSERT WITH CHECK (
    vehicle_id IN (
      SELECT license_plate FROM cars WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own car photos" ON car_photos
  FOR UPDATE USING (
    vehicle_id IN (
      SELECT license_plate FROM cars WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own car photos" ON car_photos
  FOR DELETE USING (
    vehicle_id IN (
      SELECT license_plate FROM cars WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for damage_photos
CREATE POLICY "Users can view their own damage photos" ON damage_photos
  FOR SELECT USING (
    vehicle_id IN (
      SELECT license_plate FROM cars WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own damage photos" ON damage_photos
  FOR INSERT WITH CHECK (
    vehicle_id IN (
      SELECT license_plate FROM cars WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own damage photos" ON damage_photos
  FOR UPDATE USING (
    vehicle_id IN (
      SELECT license_plate FROM cars WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own damage photos" ON damage_photos
  FOR DELETE USING (
    vehicle_id IN (
      SELECT license_plate FROM cars WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for signatures
CREATE POLICY "Users can view their own signatures" ON signatures
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own signatures" ON signatures
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own signatures" ON signatures
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own signatures" ON signatures
  FOR DELETE USING (user_id = auth.uid());

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_contract_photos_updated_at BEFORE UPDATE ON contract_photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_car_photos_updated_at BEFORE UPDATE ON car_photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_damage_photos_updated_at BEFORE UPDATE ON damage_photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_signatures_updated_at BEFORE UPDATE ON signatures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
