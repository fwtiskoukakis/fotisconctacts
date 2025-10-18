-- ==============================================
-- Supabase Storage Buckets Configuration
-- ==============================================

-- Create storage bucket for contract photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contract-photos',
  'contract-photos',
  true, -- public access for viewing photos
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signatures',
  'signatures',
  false, -- private access
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/svg+xml', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- Storage Policies for contract-photos bucket
-- ==============================================

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload contract photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contract-photos' AND
  (storage.foldername(name))[1] = 'contracts'
);

-- Allow public read access to contract photos
CREATE POLICY "Anyone can view contract photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contract-photos');

-- Allow users to update their own photos
CREATE POLICY "Users can update their contract photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contract-photos' AND
  (storage.foldername(name))[1] = 'contracts'
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their contract photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contract-photos' AND
  (storage.foldername(name))[1] = 'contracts'
);

-- ==============================================
-- Storage Policies for signatures bucket
-- ==============================================

-- Allow authenticated users to upload signatures
CREATE POLICY "Authenticated users can upload signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'signatures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own signatures
CREATE POLICY "Users can view their signatures"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signatures' AND
  ((storage.foldername(name))[1] = auth.uid()::text OR
   (storage.foldername(name))[1] = 'clients')
);

-- Allow users to update their own signatures
CREATE POLICY "Users can update their signatures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'signatures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own signatures
CREATE POLICY "Users can delete their signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'signatures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

