-- ==============================================
-- AADE Integration Schema Update
-- ==============================================
-- Run this SQL to add AADE fields to existing contracts table

-- Add AADE columns to contracts table
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS aade_dcl_id INTEGER,
ADD COLUMN IF NOT EXISTS aade_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS aade_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS aade_invoice_mark TEXT,
ADD COLUMN IF NOT EXISTS aade_status TEXT CHECK (aade_status IN ('pending', 'submitted', 'completed', 'cancelled', 'error')),
ADD COLUMN IF NOT EXISTS aade_error_message TEXT;

-- Create index for AADE status queries
CREATE INDEX IF NOT EXISTS contracts_aade_status_idx ON public.contracts (aade_status);
CREATE INDEX IF NOT EXISTS contracts_aade_dcl_id_idx ON public.contracts (aade_dcl_id);

-- Add comment
COMMENT ON COLUMN public.contracts.aade_dcl_id IS 'AADE Digital Client List ID';
COMMENT ON COLUMN public.contracts.aade_status IS 'AADE submission status';

