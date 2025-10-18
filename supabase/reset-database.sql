-- ==============================================
-- RESET DATABASE (⚠️ WARNING: DELETES ALL DATA)
-- ==============================================
-- Only run this if you want to start fresh!

-- Drop all existing tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS public.photos CASCADE;
DROP TABLE IF EXISTS public.damage_points CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop views
DROP VIEW IF EXISTS public.contracts_summary CASCADE;

-- Now you can run the full schema.sql

