-- ==============================================
-- Supabase Storage Policies Update
-- Ensures proper RLS policies for existing buckets
-- ==============================================

-- Note: Buckets already exist:
-- 1. contract-photos
-- 2. signatures
-- 3. car-photos

-- ==============================================
-- Contract Photos Bucket Policies
-- ==============================================

-- Allow authenticated users to upload contract photos
DROP POLICY IF EXISTS "Authenticated users can upload contract photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload contract photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contract-photos'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view all contract photos
DROP POLICY IF EXISTS "Authenticated users can view contract photos" ON storage.objects;
CREATE POLICY "Authenticated users can view contract photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contract-photos'
);

-- Allow users to update their own contract photos
DROP POLICY IF EXISTS "Users can update own contract photos" ON storage.objects;
CREATE POLICY "Users can update own contract photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contract-photos'
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own contract photos
DROP POLICY IF EXISTS "Users can delete own contract photos" ON storage.objects;
CREATE POLICY "Users can delete own contract photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contract-photos'
  AND auth.role() = 'authenticated'
);

-- ==============================================
-- Car Photos Bucket Policies
-- ==============================================

-- Allow authenticated users to upload car photos
DROP POLICY IF EXISTS "Authenticated users can upload car photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload car photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'car-photos'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view all car photos
DROP POLICY IF EXISTS "Authenticated users can view car photos" ON storage.objects;
CREATE POLICY "Authenticated users can view car photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'car-photos'
);

-- Allow users to update their own car photos
DROP POLICY IF EXISTS "Users can update own car photos" ON storage.objects;
CREATE POLICY "Users can update own car photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'car-photos'
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own car photos
DROP POLICY IF EXISTS "Users can delete own car photos" ON storage.objects;
CREATE POLICY "Users can delete own car photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'car-photos'
  AND auth.role() = 'authenticated'
);

-- ==============================================
-- Signatures Bucket Policies
-- ==============================================

-- Allow authenticated users to upload signatures
DROP POLICY IF EXISTS "Authenticated users can upload signatures" ON storage.objects;
CREATE POLICY "Authenticated users can upload signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'signatures'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view signatures
DROP POLICY IF EXISTS "Authenticated users can view signatures" ON storage.objects;
CREATE POLICY "Authenticated users can view signatures"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signatures'
);

-- Allow users to update their own signatures
DROP POLICY IF EXISTS "Users can update own signatures" ON storage.objects;
CREATE POLICY "Users can update own signatures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'signatures'
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own signatures
DROP POLICY IF EXISTS "Users can delete own signatures" ON storage.objects;
CREATE POLICY "Users can delete own signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'signatures'
  AND auth.role() = 'authenticated'
);

-- ==============================================
-- Make buckets public for easy access
-- (Optional - comment out if you want private access only)
-- ==============================================

UPDATE storage.buckets
SET public = true
WHERE id IN ('contract-photos', 'car-photos', 'signatures');

-- ==============================================
-- Verify policies
-- ==============================================

-- Run this to see all policies:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

COMMENT ON POLICY "Authenticated users can upload contract photos" ON storage.objects 
IS 'Allow authenticated users to upload photos to contract-photos bucket';

COMMENT ON POLICY "Authenticated users can upload car photos" ON storage.objects 
IS 'Allow authenticated users to upload photos to car-photos bucket';

COMMENT ON POLICY "Authenticated users can upload signatures" ON storage.objects 
IS 'Allow authenticated users to upload signatures to signatures bucket';

