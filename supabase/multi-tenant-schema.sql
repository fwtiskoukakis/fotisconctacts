-- ==============================================
-- MULTI-TENANT DATABASE SCHEMA
-- Complete Business Management System
-- ==============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- ORGANIZATIONS TABLE (Main Business Entity)
-- ==============================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Info
  company_name TEXT NOT NULL,
  trading_name TEXT, -- Display name
  slug TEXT UNIQUE NOT NULL, -- URL-friendly (e.g., aggelos-rentals)
  
  -- Legal Info
  vat_number TEXT UNIQUE NOT NULL, -- ΑΦΜ
  doy TEXT, -- Tax Office
  activity_code TEXT, -- ΚΑΔ
  registration_number TEXT, -- ΓΕΜΗ
  
  -- Contact Info
  primary_address TEXT NOT NULL,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'GR',
  phone_primary TEXT NOT NULL,
  phone_secondary TEXT,
  email_primary TEXT NOT NULL,
  email_support TEXT,
  website TEXT,
  
  -- Branding
  logo_url TEXT, -- Main logo
  icon_url TEXT, -- Small icon/favicon
  brand_color_primary TEXT DEFAULT '#007AFF',
  brand_color_secondary TEXT DEFAULT '#FFD700',
  contract_header_image_url TEXT,
  
  -- AADE Integration
  aade_user_id TEXT,
  aade_subscription_key TEXT,
  aade_enabled BOOLEAN DEFAULT false,
  aade_test_mode BOOLEAN DEFAULT true,
  
  -- Business Settings
  business_type TEXT CHECK (business_type IN ('small', 'medium', 'large')),
  timezone TEXT DEFAULT 'Europe/Athens',
  currency TEXT DEFAULT 'EUR',
  language TEXT DEFAULT 'el',
  
  -- Features & Limits
  max_users INTEGER DEFAULT 5,
  max_vehicles INTEGER DEFAULT 50,
  max_contracts_per_month INTEGER DEFAULT 1000,
  
  -- Subscription
  subscription_plan TEXT CHECK (subscription_plan IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_status TEXT CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_starts_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('greek', 
      coalesce(company_name, '') || ' ' ||
      coalesce(trading_name, '') || ' ' ||
      coalesce(vat_number, '')
    )
  ) STORED
);

-- Indexes for organizations
CREATE INDEX organizations_slug_idx ON organizations (slug);
CREATE INDEX organizations_vat_number_idx ON organizations (vat_number);
CREATE INDEX organizations_search_idx ON organizations USING GIN (search_vector);

-- ==============================================
-- BRANCHES/LOCATIONS TABLE
-- ==============================================
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- ORGANIZATION SETTINGS TABLE
-- ==============================================
CREATE TABLE public.organization_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Contract Settings
  contract_prefix TEXT DEFAULT 'CNT', -- Contract number prefix
  contract_number_start INTEGER DEFAULT 1000,
  contract_template_id UUID,
  auto_send_contracts BOOLEAN DEFAULT false,
  
  -- Email Settings
  email_notifications_enabled BOOLEAN DEFAULT true,
  email_from_name TEXT,
  email_from_address TEXT,
  email_signature TEXT,
  
  -- SMS Settings
  sms_enabled BOOLEAN DEFAULT false,
  sms_provider TEXT,
  sms_api_key TEXT,
  
  -- Pricing Settings
  default_currency TEXT DEFAULT 'EUR',
  tax_rate DECIMAL(5, 2) DEFAULT 0.24, -- 24% VAT
  
  -- Terms & Conditions
  terms_and_conditions TEXT,
  privacy_policy TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id)
);

-- ==============================================
-- INTEGRATIONS TABLE
-- ==============================================
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  integration_type TEXT CHECK (integration_type IN ('wordpress', 'woocommerce', 'wheelsys', 'xml_feed', 'api', 'webhook')),
  name TEXT NOT NULL,
  
  -- Configuration
  config JSONB NOT NULL DEFAULT '{}',
  credentials JSONB, -- Encrypted
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT CHECK (sync_status IN ('success', 'failed', 'pending', 'in_progress')),
  sync_error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- IMPORT LOGS TABLE
-- ==============================================
CREATE TABLE public.import_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL,
  
  import_type TEXT CHECK (import_type IN ('cars', 'customers', 'contracts')),
  source TEXT, -- 'wordpress', 'xml', 'csv', 'manual'
  
  total_records INTEGER DEFAULT 0,
  imported_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  skipped_records INTEGER DEFAULT 0,
  
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_log JSONB,
  
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- VEHICLE ACCESSORIES TABLE
-- ==============================================
CREATE TABLE public.vehicle_accessories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('safety', 'comfort', 'entertainment', 'utility')),
  daily_price DECIMAL(8, 2) DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- VEHICLE ACCESSORY ASSIGNMENTS
-- ==============================================
CREATE TABLE public.vehicle_accessory_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  accessory_id UUID REFERENCES vehicle_accessories(id) ON DELETE CASCADE,
  
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unassigned_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(car_id, accessory_id, organization_id)
);

-- ==============================================
-- MAINTENANCE RECORDS TABLE
-- ==============================================
CREATE TABLE public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  
  maintenance_type TEXT CHECK (maintenance_type IN ('routine', 'repair', 'inspection', 'emergency')),
  description TEXT NOT NULL,
  mileage INTEGER,
  cost DECIMAL(10, 2),
  service_provider TEXT,
  service_provider_contact TEXT,
  
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  next_due_date TIMESTAMP WITH TIME ZONE,
  next_due_mileage INTEGER,
  
  -- Documents
  receipt_url TEXT,
  warranty_until TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- CUSTOMER PROFILES TABLE
-- ==============================================
CREATE TABLE public.customer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Personal Info
  full_name TEXT NOT NULL,
  id_number TEXT, -- ID/Passport Number
  date_of_birth DATE,
  nationality TEXT DEFAULT 'GR',
  driver_license_number TEXT,
  driver_license_expiry DATE,
  
  -- Contact Info
  phone_primary TEXT,
  phone_secondary TEXT,
  email TEXT,
  address TEXT,
  
  -- Business Info (if company)
  company_name TEXT,
  company_vat_number TEXT,
  company_address TEXT,
  
  -- Internal Rating
  customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
  vip_status BOOLEAN DEFAULT false,
  blacklist_status BOOLEAN DEFAULT false,
  blacklist_reason TEXT,
  
  -- Financial
  total_spent DECIMAL(12, 2) DEFAULT 0,
  total_rentals INTEGER DEFAULT 0,
  
  -- Documents
  id_document_url TEXT,
  license_document_url TEXT,
  insurance_document_url TEXT,
  
  -- Metadata
  notes TEXT, -- Staff notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('greek', 
      coalesce(full_name, '') || ' ' ||
      coalesce(id_number, '') || ' ' ||
      coalesce(phone_primary, '') || ' ' ||
      coalesce(email, '') || ' ' ||
      coalesce(driver_license_number, '')
    )
  ) STORED
);

-- Indexes for customer profiles
CREATE INDEX customer_profiles_organization_idx ON customer_profiles (organization_id);
CREATE INDEX customer_profiles_search_idx ON customer_profiles USING GIN (search_vector);

-- ==============================================
-- COMMUNICATION LOGS TABLE
-- ==============================================
CREATE TABLE public.communication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  
  communication_type TEXT CHECK (communication_type IN ('email', 'sms', 'phone', 'whatsapp', 'viber')),
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  
  subject TEXT,
  message TEXT,
  template_id UUID,
  
  -- Status
  status TEXT CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'pending')),
  error_message TEXT,
  
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- EXPENSE CATEGORIES TABLE
-- ==============================================
CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#007AFF',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- EXPENSES TABLE
-- ==============================================
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- NOTIFICATION TEMPLATES TABLE
-- ==============================================
CREATE TABLE public.notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('email', 'sms', 'push')),
  trigger_event TEXT NOT NULL, -- 'rental_start', 'rental_end', 'overdue', etc.
  
  subject TEXT, -- For email
  body TEXT NOT NULL,
  
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- UPDATE EXISTING TABLES
-- ==============================================

-- Update users table for multi-tenant support
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('owner', 'admin', 'manager', 'agent', 'viewer')) DEFAULT 'agent',
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update contracts table for multi-tenant support
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL;

-- Update cars table for multi-tenant support
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('car', 'atv', 'scooter', 'motorcycle', 'van', 'truck')),
ADD COLUMN IF NOT EXISTS vin TEXT,
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS insurance_provider TEXT,
ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT,
ADD COLUMN IF NOT EXISTS insurance_expiry DATE,
ADD COLUMN IF NOT EXISTS kteo_expiry DATE,
ADD COLUMN IF NOT EXISTS road_tax_expiry DATE,
ADD COLUMN IF NOT EXISTS total_rentals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0;

-- ==============================================
-- ROW LEVEL SECURITY POLICIES
-- ==============================================

-- Organizations - users can only access their own organization
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own organization" ON organizations
  FOR ALL USING (
    id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

-- Branches - users can access branches from their organization
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access organization branches" ON branches
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

-- Organization settings - users can access their organization's settings
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access organization settings" ON organization_settings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

-- Integrations - users can access their organization's integrations
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access organization integrations" ON integrations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

-- Import logs - users can access their organization's import logs
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access organization import logs" ON import_logs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

-- Vehicle accessories - users can access their organization's accessories
ALTER TABLE public.vehicle_accessories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access organization accessories" ON vehicle_accessories
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

-- Maintenance records - users can access their organization's maintenance
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access organization maintenance" ON maintenance_records
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

-- Customer profiles - users can access their organization's customers
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access organization customers" ON customer_profiles
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

-- Communication logs - users can access their organization's communications
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access organization communications" ON communication_logs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

-- Expense categories - users can access their organization's expense categories
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access organization expense categories" ON expense_categories
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

-- Expenses - users can access their organization's expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access organization expenses" ON expenses
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

-- Notification templates - users can access their organization's templates
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access organization notification templates" ON notification_templates
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

-- Update existing policies for multi-tenant support
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

CREATE POLICY "Users can view organization profiles" ON public.users
  FOR SELECT USING (
    organization_id IS NULL OR 
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Update contracts policies for multi-tenant support
DROP POLICY IF EXISTS "Users can view all contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can update contracts" ON public.contracts;

CREATE POLICY "Users can view organization contracts" ON public.contracts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

CREATE POLICY "Users can insert organization contracts" ON public.contracts
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

CREATE POLICY "Users can update organization contracts" ON public.contracts
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

-- Update cars policies for multi-tenant support
DROP POLICY IF EXISTS "Users can view all cars" ON public.cars;
DROP POLICY IF EXISTS "Users can insert cars" ON public.cars;
DROP POLICY IF EXISTS "Users can update cars" ON public.cars;

CREATE POLICY "Users can view organization cars" ON public.cars
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

CREATE POLICY "Users can insert organization cars" ON public.cars
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

CREATE POLICY "Users can update organization cars" ON public.cars
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

-- ==============================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organization_settings_updated_at BEFORE UPDATE ON organization_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicle_accessories_updated_at BEFORE UPDATE ON vehicle_accessories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON expense_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- SAMPLE DATA
-- ==============================================

-- Insert default expense categories
INSERT INTO expense_categories (organization_id, name, description, color) VALUES
('00000000-0000-0000-0000-000000000000', 'Fuel', 'Vehicle fuel costs', '#FF6B6B'),
('00000000-0000-0000-0000-000000000000', 'Maintenance', 'Vehicle maintenance and repairs', '#4ECDC4'),
('00000000-0000-0000-0000-000000000000', 'Insurance', 'Vehicle insurance premiums', '#45B7D1'),
('00000000-0000-0000-0000-000000000000', 'Taxes & Licenses', 'Road tax, KTEO, licenses', '#96CEB4'),
('00000000-0000-0000-0000-000000000000', 'Marketing', 'Advertising and marketing expenses', '#FFEAA7'),
('00000000-0000-0000-0000-000000000000', 'Office', 'Office supplies and utilities', '#DDA0DD'),
('00000000-0000-0000-0000-000000000000', 'Staff', 'Staff salaries and benefits', '#98D8C8'),
('00000000-0000-0000-0000-000000000000', 'Other', 'Miscellaneous expenses', '#F7DC6F');

-- Insert default notification templates
INSERT INTO notification_templates (organization_id, name, type, trigger_event, subject, body, is_default) VALUES
('00000000-0000-0000-0000-000000000000', 'Booking Confirmation', 'email', 'booking_confirmed', 'Booking Confirmation - {{contract_number}}', 'Dear {{customer_name}},\n\nYour booking has been confirmed.\n\nContract: {{contract_number}}\nVehicle: {{vehicle_info}}\nPickup: {{pickup_date}} at {{pickup_time}}\nReturn: {{return_date}} at {{return_time}}\n\nThank you for choosing us!\n\nBest regards,\n{{company_name}}', true),
('00000000-0000-0000-0000-000000000000', 'Pickup Reminder', 'email', 'pickup_reminder', 'Pickup Reminder - Tomorrow', 'Dear {{customer_name}},\n\nThis is a friendly reminder that your vehicle pickup is scheduled for tomorrow.\n\nContract: {{contract_number}}\nVehicle: {{vehicle_info}}\nPickup: {{pickup_date}} at {{pickup_time}}\nLocation: {{pickup_location}}\n\nPlease bring your driver''s license and the required documents.\n\nBest regards,\n{{company_name}}', true),
('00000000-0000-0000-0000-000000000000', 'Return Reminder', 'email', 'return_reminder', 'Return Reminder - Tomorrow', 'Dear {{customer_name}},\n\nThis is a friendly reminder that your vehicle return is scheduled for tomorrow.\n\nContract: {{contract_number}}\nVehicle: {{vehicle_info}}\nReturn: {{return_date}} at {{return_time}}\nLocation: {{return_location}}\n\nPlease ensure the vehicle is clean and has the same fuel level as at pickup.\n\nBest regards,\n{{company_name}}', true),
('00000000-0000-0000-0000-000000000000', 'Overdue Alert', 'email', 'overdue_rental', 'Overdue Rental Alert', 'Dear {{customer_name}},\n\nYour vehicle rental has exceeded the scheduled return date.\n\nContract: {{contract_number}}\nVehicle: {{vehicle_info}}\nOriginal Return Date: {{return_date}}\nDays Overdue: {{days_overdue}}\n\nPlease contact us immediately to arrange the return.\n\nBest regards,\n{{company_name}}', true);

-- Insert default vehicle accessories
INSERT INTO vehicle_accessories (organization_id, name, description, category, daily_price) VALUES
('00000000-0000-0000-0000-000000000000', 'GPS Navigation', 'Portable GPS navigation system', 'utility', 5.00),
('00000000-0000-0000-0000-000000000000', 'Child Safety Seat', 'Child safety seat for ages 1-4', 'safety', 8.00),
('00000000-0000-0000-0000-000000000000', 'Baby Seat', 'Baby car seat for ages 0-1', 'safety', 8.00),
('00000000-0000-0000-0000-000000000000', 'Booster Seat', 'Booster seat for ages 4-12', 'safety', 5.00),
('00000000-0000-0000-0000-000000000000', 'Roof Rack', 'Roof rack for additional luggage', 'utility', 10.00),
('00000000-0000-0000-0000-000000000000', 'Bike Rack', 'Bicycle carrier for roof or rear', 'utility', 12.00),
('00000000-0000-0000-0000-000000000000', 'Ski Rack', 'Ski and snowboard carrier', 'utility', 15.00),
('00000000-0000-0000-0000-000000000000', 'Additional Driver', 'Additional driver authorization', 'utility', 5.00),
('00000000-0000-0000-0000-000000000000', 'Full Insurance', 'Full coverage insurance upgrade', 'safety', 15.00);

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================
DO $$
BEGIN
    RAISE NOTICE '🎉 MULTI-TENANT DATABASE SCHEMA CREATED SUCCESSFULLY!';
    RAISE NOTICE '📊 Tables created: organizations, branches, integrations, customer_profiles, etc.';
    RAISE NOTICE '🔒 Row Level Security enabled for all tables';
    RAISE NOTICE '🚀 Ready for business onboarding and multi-tenant features!';
    RAISE NOTICE '📝 Sample data inserted: expense categories, notification templates, vehicle accessories';
END $$;


