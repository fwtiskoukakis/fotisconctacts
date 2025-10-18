-- ==============================================
-- CONTRACT CATEGORIES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.contract_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    icon VARCHAR(10) NOT NULL DEFAULT '📋',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- CONTRACT TAGS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.contract_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    description TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- CONTRACT COMMENTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.contract_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- CONTRACT ATTACHMENTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.contract_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('photo', 'document', 'other')),
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

-- ==============================================
-- CONTRACT REMINDERS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.contract_reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('pickup', 'return', 'payment', 'custom')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- UPDATE CONTRACTS TABLE WITH ENHANCEMENTS
-- ==============================================
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.contract_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- ==============================================
-- INDEXES
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_contract_categories_name ON public.contract_categories(name);
CREATE INDEX IF NOT EXISTS idx_contract_categories_is_default ON public.contract_categories(is_default);

CREATE INDEX IF NOT EXISTS idx_contract_tags_name ON public.contract_tags(name);
CREATE INDEX IF NOT EXISTS idx_contract_tags_usage_count ON public.contract_tags(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_contract_comments_contract_id ON public.contract_comments(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_comments_user_id ON public.contract_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_comments_created_at ON public.contract_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contract_attachments_contract_id ON public.contract_attachments(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_attachments_file_type ON public.contract_attachments(file_type);
CREATE INDEX IF NOT EXISTS idx_contract_attachments_uploaded_at ON public.contract_attachments(uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_contract_reminders_contract_id ON public.contract_reminders(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_reminders_scheduled_date ON public.contract_reminders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_contract_reminders_is_active ON public.contract_reminders(is_active);
CREATE INDEX IF NOT EXISTS idx_contract_reminders_is_sent ON public.contract_reminders(is_sent);

CREATE INDEX IF NOT EXISTS idx_contracts_category_id ON public.contracts(category_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tags ON public.contracts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_contracts_priority ON public.contracts(priority);

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================
ALTER TABLE public.contract_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_reminders ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Users can view all categories" ON public.contract_categories
    FOR SELECT USING (true);

CREATE POLICY "Users can create categories" ON public.contract_categories
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update categories" ON public.contract_categories
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete non-default categories" ON public.contract_categories
    FOR DELETE USING (auth.uid() IS NOT NULL AND is_default = FALSE);

-- Tags policies
CREATE POLICY "Users can view all tags" ON public.contract_tags
    FOR SELECT USING (true);

CREATE POLICY "Users can create tags" ON public.contract_tags
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update tags" ON public.contract_tags
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete tags" ON public.contract_tags
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Comments policies
CREATE POLICY "Users can view contract comments" ON public.contract_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.contracts 
            WHERE id = contract_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create comments" ON public.contract_comments
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.contracts 
            WHERE id = contract_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own comments" ON public.contract_comments
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments" ON public.contract_comments
    FOR DELETE USING (user_id = auth.uid());

-- Attachments policies
CREATE POLICY "Users can view contract attachments" ON public.contract_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.contracts 
            WHERE id = contract_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create attachments" ON public.contract_attachments
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        uploaded_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.contracts 
            WHERE id = contract_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own attachments" ON public.contract_attachments
    FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete own attachments" ON public.contract_attachments
    FOR DELETE USING (uploaded_by = auth.uid());

-- Reminders policies
CREATE POLICY "Users can view contract reminders" ON public.contract_reminders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.contracts 
            WHERE id = contract_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create reminders" ON public.contract_reminders
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.contracts 
            WHERE id = contract_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update reminders" ON public.contract_reminders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.contracts 
            WHERE id = contract_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete reminders" ON public.contract_reminders
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.contracts 
            WHERE id = contract_id AND user_id = auth.uid()
        )
    );

-- ==============================================
-- FUNCTIONS
-- ==============================================

-- Function to update updated_at timestamp for categories
CREATE OR REPLACE FUNCTION update_contract_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for categories
CREATE TRIGGER trigger_update_contract_categories_updated_at
    BEFORE UPDATE ON public.contract_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_categories_updated_at();

-- Function to update updated_at timestamp for comments
CREATE OR REPLACE FUNCTION update_contract_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comments
CREATE TRIGGER trigger_update_contract_comments_updated_at
    BEFORE UPDATE ON public.contract_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_comments_updated_at();

-- Function to increment tag usage count
CREATE OR REPLACE FUNCTION increment_tag_usage_count(tag_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.contract_tags 
    SET usage_count = usage_count + 1
    WHERE id = tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement tag usage count
CREATE OR REPLACE FUNCTION decrement_tag_usage_count(tag_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.contract_tags 
    SET usage_count = GREATEST(usage_count - 1, 0)
    WHERE id = tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- SAMPLE DATA
-- ==============================================

-- Insert default categories
INSERT INTO public.contract_categories (id, name, description, color, icon, is_default) VALUES
('00000000-0000-0000-0000-000000000001', 'Standard Rental', 'Regular car rental contracts', '#3B82F6', '🚗', TRUE),
('00000000-0000-0000-0000-000000000002', 'Luxury Rental', 'Premium and luxury vehicle rentals', '#F59E0B', '✨', TRUE),
('00000000-0000-0000-0000-000000000003', 'Commercial Rental', 'Business and commercial vehicle rentals', '#10B981', '🚛', TRUE),
('00000000-0000-0000-0000-000000000004', 'Long-term Rental', 'Extended rental periods', '#8B5CF6', '📅', TRUE),
('00000000-0000-0000-0000-000000000005', 'Emergency Rental', 'Urgent or emergency vehicle needs', '#EF4444', '🚨', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Insert default tags
INSERT INTO public.contract_tags (id, name, color, description) VALUES
('00000000-0000-0000-0000-000000000001', 'Νέος Πελάτης', '#3B82F6', 'First-time customer'),
('00000000-0000-0000-0000-000000000002', 'VIP', '#F59E0B', 'VIP customer'),
('00000000-0000-0000-0000-000000000003', 'Εταιρικός', '#10B981', 'Corporate client'),
('00000000-0000-0000-0000-000000000004', 'Σαββατοκύριακο', '#8B5CF6', 'Weekend rental'),
('00000000-0000-0000-0000-000000000005', 'Αεροδρόμιο', '#06B6D4', 'Airport pickup/dropoff')
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- COMMENTS
-- ==============================================
COMMENT ON TABLE public.contract_categories IS 'Categories for organizing contracts';
COMMENT ON TABLE public.contract_tags IS 'Tags for labeling and filtering contracts';
COMMENT ON TABLE public.contract_comments IS 'Comments and notes on contracts';
COMMENT ON TABLE public.contract_attachments IS 'File attachments for contracts';
COMMENT ON TABLE public.contract_reminders IS 'Reminders and notifications for contracts';
