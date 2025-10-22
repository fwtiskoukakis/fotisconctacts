# Supabase Storage Setup - Dashboard Method

## ⚠️ Important Note
Storage policies cannot be set via SQL. You must use the Supabase Dashboard.

---

## Setup Instructions (5 minutes)

### Step 1: Open Storage Settings

1. Go to your Supabase Dashboard
2. Navigate to **Storage** (left sidebar)
3. You should see your 3 buckets:
   - `contract-photos`
   - `car-photos`
   - `signatures`

---

### Step 2: Make Buckets Public

For each bucket (`contract-photos`, `car-photos`, `signatures`):

1. Click on the bucket name
2. Click the **"Settings"** icon (gear icon) in top right
3. Enable **"Public bucket"** toggle
4. Click **"Save"**

This allows the app to display photos without authentication checks.

---

### Step 3: Set Up Policies (For Each Bucket)

#### For `contract-photos` bucket:

1. Click on the bucket name
2. Go to **"Policies"** tab
3. Click **"New Policy"**

**Policy 1: Allow Upload**
```
Policy name: Allow authenticated uploads
Allowed operation: INSERT
Target roles: authenticated
USING expression: bucket_id = 'contract-photos'
WITH CHECK expression: bucket_id = 'contract-photos'
```

**Policy 2: Allow Read**
```
Policy name: Allow authenticated reads
Allowed operation: SELECT
Target roles: authenticated
USING expression: bucket_id = 'contract-photos'
```

**Policy 3: Allow Update**
```
Policy name: Allow authenticated updates
Allowed operation: UPDATE
Target roles: authenticated
USING expression: bucket_id = 'contract-photos'
WITH CHECK expression: bucket_id = 'contract-photos'
```

**Policy 4: Allow Delete**
```
Policy name: Allow authenticated deletes
Allowed operation: DELETE
Target roles: authenticated
USING expression: bucket_id = 'contract-photos'
```

#### Repeat for `car-photos` bucket:
(Same policies, just change `contract-photos` to `car-photos`)

#### Repeat for `signatures` bucket:
(Same policies, just change `contract-photos` to `signatures`)

---

### Alternative: Simple Policy (If Above Doesn't Work)

If you want simpler setup, just create ONE policy per bucket:

**For each bucket:**
1. Go to Policies tab
2. Click "New Policy"
3. Choose **"Full customization"**
4. Name: `Allow all for authenticated users`
5. Select ALL operations: SELECT, INSERT, UPDATE, DELETE
6. Policy definition:
```sql
bucket_id = 'YOUR_BUCKET_NAME'
```
7. Click Create Policy

---

## ✅ Verification

Test if it works:

1. Try uploading a photo from your app
2. Check if it appears in Storage
3. Try viewing the photo URL in browser
4. Should see the image without errors

---

## Quick Setup Alternative

If you want to skip policies for testing:
1. Just make all 3 buckets **Public**
2. This allows anyone to read (but only authenticated users can write via the app code)
3. Good enough for development/testing

---

## Summary

**Instead of running storage-policies-update.sql:**
- ✅ Make buckets public via Dashboard
- ✅ Add policies via Dashboard UI
- ❌ Don't run SQL file (it will error)

**After this, storage is ready to use!**

