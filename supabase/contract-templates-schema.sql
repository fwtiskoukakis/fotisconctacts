-- ==============================================
-- CONTRACT TEMPLATES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.contract_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('standard', 'luxury', 'commercial', 'long-term', 'custom')),
    is_default BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    
    -- Template data as JSONB
    template_data JSONB NOT NULL DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT unique_default_per_category UNIQUE (category, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- ==============================================
-- INDEXES
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_contract_templates_category ON public.contract_templates(category);
CREATE INDEX IF NOT EXISTS idx_contract_templates_created_by ON public.contract_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_contract_templates_is_public ON public.contract_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_contract_templates_usage_count ON public.contract_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_contract_templates_tags ON public.contract_templates USING GIN(tags);

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view public templates and their own templates
CREATE POLICY "Users can view public templates and own templates" ON public.contract_templates
    FOR SELECT USING (
        is_public = TRUE OR 
        created_by = auth.uid()
    );

-- Policy: Users can create templates
CREATE POLICY "Users can create templates" ON public.contract_templates
    FOR INSERT WITH CHECK (
        created_by = auth.uid()
    );

-- Policy: Users can update their own templates
CREATE POLICY "Users can update own templates" ON public.contract_templates
    FOR UPDATE USING (
        created_by = auth.uid()
    );

-- Policy: Users can delete their own templates (except default ones)
CREATE POLICY "Users can delete own non-default templates" ON public.contract_templates
    FOR DELETE USING (
        created_by = auth.uid() AND 
        is_default = FALSE
    );

-- ==============================================
-- FUNCTIONS
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contract_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_contract_templates_updated_at
    BEFORE UPDATE ON public.contract_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_templates_updated_at();

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_template_usage_count(template_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.contract_templates 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- SAMPLE DATA
-- ==============================================

-- Insert default templates
INSERT INTO public.contract_templates (
    id,
    name,
    description,
    category,
    is_default,
    is_public,
    created_by,
    template_data
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Standard Car Rental',
    'Basic car rental template for everyday use',
    'standard',
    TRUE,
    TRUE,
    (SELECT id FROM public.users LIMIT 1), -- Use first user as creator
    '{
        "defaultPickupLocation": "Office",
        "defaultDropoffLocation": "Office",
        "defaultPickupTime": "09:00",
        "defaultDropoffTime": "17:00",
        "defaultDuration": 1,
        "baseDailyRate": 50,
        "depositAmount": 100,
        "insuranceCost": 10,
        "additionalFees": [
            {
                "id": "late_fee",
                "name": "Late Return Fee",
                "amount": 25,
                "type": "per_day",
                "description": "Additional charge for late returns",
                "isOptional": false
            }
        ],
        "termsAndConditions": "Standard rental terms apply. Customer is responsible for any damages.",
        "cancellationPolicy": "Free cancellation up to 24 hours before pickup.",
        "lateReturnPolicy": "Late returns subject to additional fees.",
        "requiredCarFeatures": ["Air Conditioning", "Power Steering"],
        "minimumFuelLevel": 6,
        "requiredDocuments": ["Driver License", "ID Card"],
        "minimumAge": 21,
        "licenseRequirement": "Valid driver license required",
        "customClauses": [
            {
                "id": "fuel_clause",
                "title": "Fuel Policy",
                "content": "Vehicle must be returned with same fuel level as pickup.",
                "isRequired": true,
                "category": "safety"
            }
        ],
        "reminderSettings": {
            "pickupReminder": {
                "enabled": true,
                "hoursBefore": 2,
                "message": "Reminder: Your car rental pickup is scheduled in 2 hours."
            },
            "returnReminder": {
                "enabled": true,
                "hoursBefore": 2,
                "message": "Reminder: Your car rental return is due in 2 hours."
            },
            "paymentReminder": {
                "enabled": true,
                "daysBefore": 1,
                "message": "Reminder: Payment is due tomorrow."
            }
        }
    }'::jsonb
), (
    '00000000-0000-0000-0000-000000000002',
    'Luxury Car Rental',
    'Premium car rental template for luxury vehicles',
    'luxury',
    TRUE,
    TRUE,
    (SELECT id FROM public.users LIMIT 1),
    '{
        "defaultPickupLocation": "Office",
        "defaultDropoffLocation": "Office",
        "defaultPickupTime": "10:00",
        "defaultDropoffTime": "18:00",
        "defaultDuration": 1,
        "baseDailyRate": 150,
        "depositAmount": 500,
        "insuranceCost": 25,
        "additionalFees": [
            {
                "id": "luxury_fee",
                "name": "Luxury Service Fee",
                "amount": 50,
                "type": "fixed",
                "description": "Premium service fee for luxury vehicles",
                "isOptional": false
            }
        ],
        "termsAndConditions": "Luxury vehicle rental terms. Strict damage policy applies.",
        "cancellationPolicy": "Free cancellation up to 48 hours before pickup.",
        "lateReturnPolicy": "Late returns subject to premium fees.",
        "requiredCarFeatures": ["Leather Seats", "Navigation", "Premium Sound"],
        "minimumFuelLevel": 8,
        "requiredDocuments": ["Driver License", "ID Card", "Credit Card"],
        "minimumAge": 25,
        "licenseRequirement": "Valid driver license with clean record required",
        "customClauses": [
            {
                "id": "luxury_damage",
                "title": "Luxury Damage Policy",
                "content": "Any damage to luxury vehicle will result in immediate charges.",
                "isRequired": true,
                "category": "legal"
            }
        ],
        "reminderSettings": {
            "pickupReminder": {
                "enabled": true,
                "hoursBefore": 4,
                "message": "Reminder: Your luxury car rental pickup is scheduled in 4 hours."
            },
            "returnReminder": {
                "enabled": true,
                "hoursBefore": 4,
                "message": "Reminder: Your luxury car rental return is due in 4 hours."
            },
            "paymentReminder": {
                "enabled": true,
                "daysBefore": 2,
                "message": "Reminder: Luxury vehicle payment is due in 2 days."
            }
        }
    }'::jsonb
);

-- ==============================================
-- COMMENTS
-- ==============================================
COMMENT ON TABLE public.contract_templates IS 'Stores contract templates for quick contract creation';
COMMENT ON COLUMN public.contract_templates.template_data IS 'JSONB field containing all template configuration data';
COMMENT ON COLUMN public.contract_templates.usage_count IS 'Number of times this template has been used';
COMMENT ON COLUMN public.contract_templates.tags IS 'Array of tags for categorizing and searching templates';
