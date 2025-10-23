# Supabase Photo Storage Setup Checklist

## ✅ Quick Setup for Contract Photos

Follow these steps to ensure your Supabase instance is properly configured for photo uploads.

## 1. Create Storage Buckets

### Option A: Using Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New Bucket**
4. Create the following buckets:

#### Bucket: `contract-photos`
- **Name**: `contract-photos`
- **Public**: ✅ Yes (photos need to be publicly accessible)
- **File size limit**: 10 MB
- **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp`

#### Bucket: `car-photos`
- **Name**: `car-photos`
- **Public**: ✅ Yes
- **File size limit**: 10 MB
- **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp`

#### Bucket: `signatures`
- **Name**: `signatures`
- **Public**: ❌ No (signatures should be private)
- **File size limit**: 2 MB
- **Allowed MIME types**: `image/png, image/svg+xml, image/jpeg`

### Option B: Using SQL

Run this in the SQL Editor:

```sql
-- Create contract-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contract-photos',
  'contract-photos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create car-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'car-photos',
  'car-photos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create signatures bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signatures',
  'signatures',
  false,
  2097152, -- 2MB
  ARRAY['image/png', 'image/svg+xml', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;
```

## 2. Configure Storage Policies

### For `contract-photos` bucket:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload contract photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contract-photos');

-- Allow public read access
CREATE POLICY "Anyone can view contract photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contract-photos');

-- Allow authenticated users to delete
CREATE POLICY "Users can delete contract photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contract-photos');

-- Allow authenticated users to update
CREATE POLICY "Users can update contract photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'contract-photos');
```

### For `car-photos` bucket:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload car photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'car-photos');

-- Allow public read access
CREATE POLICY "Anyone can view car photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'car-photos');

-- Allow authenticated users to delete
CREATE POLICY "Users can delete car photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'car-photos');

-- Allow authenticated users to update
CREATE POLICY "Users can update car photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'car-photos');
```

### For `signatures` bucket:

```sql
-- Allow authenticated users to upload signatures
CREATE POLICY "Authenticated users can upload signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'signatures');

-- Allow users to view signatures
CREATE POLICY "Users can view signatures"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'signatures');

-- Allow users to delete signatures
CREATE POLICY "Users can delete signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'signatures');
```

## 3. Verify Database Table

Ensure the `contract_photos` table exists:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'contract_photos'
);
```

If it doesn't exist, create it:

```sql
CREATE TABLE IF NOT EXISTS public.contract_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    photo_url TEXT NOT NULL,
    photo_type TEXT CHECK (photo_type IN ('pickup', 'dropoff', 'damage', 'general')) DEFAULT 'general',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.contract_photos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert contract photos"
ON public.contract_photos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contracts
    WHERE contracts.id = contract_photos.contract_id
    AND contracts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view contract photos"
ON public.contract_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contracts
    WHERE contracts.id = contract_photos.contract_id
    AND contracts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update contract photos"
ON public.contract_photos FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.contracts
    WHERE contracts.id = contract_photos.contract_id
    AND contracts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete contract photos"
ON public.contract_photos FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.contracts
    WHERE contracts.id = contract_photos.contract_id
    AND contracts.user_id = auth.uid()
  )
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS contract_photos_contract_id_idx 
ON public.contract_photos (contract_id);
```

## 4. Test Connection

### Using the Test Page

1. Open the app
2. Go to **Settings** → **🧪 Developer / Test**
3. Tap **📸 Contract Photo Upload Test**
4. Tap **🔌 Test Supabase Connection** button
5. You should see: "✅ Success - Supabase connection test successful!"

### Using SQL

```sql
-- Test database connection
SELECT COUNT(*) FROM public.contracts LIMIT 1;

-- Test storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'contract-photos';

-- Test storage policies
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

-- Test contract_photos table
SELECT * FROM public.contract_photos LIMIT 1;
```

## 5. Verify Environment Variables

Check your `.env` or app configuration has:

```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 📋 Quick Verification Checklist

### Storage Buckets
- [ ] `contract-photos` bucket created (public)
- [ ] `car-photos` bucket created (public)
- [ ] `signatures` bucket created (private)

### Storage Policies
- [ ] Upload policies for authenticated users
- [ ] Read policies (public for photos, authenticated for signatures)
- [ ] Delete policies for authenticated users
- [ ] Update policies for authenticated users

### Database
- [ ] `contract_photos` table exists
- [ ] Row Level Security enabled
- [ ] Insert policy configured
- [ ] Select policy configured
- [ ] Update policy configured
- [ ] Delete policy configured
- [ ] Index on `contract_id` created

### App Configuration
- [ ] Supabase URL configured
- [ ] Supabase Anon Key configured
- [ ] Camera permissions in `app.json`
- [ ] Media library permissions in `app.json`

### Testing
- [ ] Test connection button works
- [ ] Can upload photos
- [ ] Photos appear in gallery
- [ ] Can view full screen
- [ ] No errors in console

## 🔍 Troubleshooting

### Error: "Bucket not found"
- ✅ Check bucket exists in Supabase Dashboard → Storage
- ✅ Verify bucket name is exactly: `contract-photos` (no spaces, lowercase)

### Error: "Permission denied"
- ✅ Check storage policies exist
- ✅ Verify user is authenticated (logged in)
- ✅ Check RLS policies on `contract_photos` table

### Error: "No such file"
- ✅ Verify photo URL is correct
- ✅ Check bucket is set to public
- ✅ Try refreshing the gallery

### Error: "Database error"
- ✅ Verify `contract_photos` table exists
- ✅ Check `contracts` table has the contract ID
- ✅ Verify foreign key relationship is correct

### Photos Upload but Don't Show in Gallery
- ✅ Check `contract_id` matches between upload and gallery
- ✅ Tap "Refresh" button in gallery
- ✅ Check console for error messages
- ✅ Verify database policies allow SELECT

## 🎯 Success Criteria

You're ready to go when:
1. ✅ Test connection succeeds
2. ✅ Photos upload without errors
3. ✅ Photos appear in gallery after refresh
4. ✅ Full screen viewer works
5. ✅ No errors in console

## 📚 Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Policies Guide](https://supabase.com/docs/guides/storage/security/access-control)
- [Complete Implementation Guide](./CONTRACT_PHOTO_UPLOAD_GUIDE.md)

## 🚀 Next Steps

After completing this checklist:
1. Test the photo upload functionality in the test page
2. Review the [Complete Implementation Guide](./CONTRACT_PHOTO_UPLOAD_GUIDE.md)
3. Integrate photo upload into your contract creation pages
4. Integrate photo gallery into your contract details pages
5. Add photos to PDF exports

---

✨ **Pro Tip**: Use the test page as a reference implementation when integrating photos into your production pages!

