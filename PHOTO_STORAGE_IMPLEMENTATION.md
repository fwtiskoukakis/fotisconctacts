# Photo Storage Implementation Guide

## Overview
This guide shows how to integrate Supabase Storage for contract photos, car photos, and signatures in your FleetOS app.

## Supabase Storage Configuration

### Existing Buckets:
1. **contract-photos** - Photos taken during contract creation/completion
2. **car-photos** - Vehicle photos and damage documentation
3. **signatures** - User and client signatures

### Storage URL:
```
https://kwjtqsomuwdotfkrqbne.storage.supabase.co/storage/v1/s3
```

---

## Setup Steps

### Step 1: Run Storage Policies SQL

Run this in your Supabase SQL Editor:

```bash
supabase/storage-policies-update.sql
```

This will:
- Set up RLS policies for all buckets
- Allow authenticated users to upload/view/delete photos
- Make buckets public for easy access

### Step 2: Verify Buckets are Public

In Supabase Dashboard:
1. Go to Storage
2. Check each bucket (contract-photos, car-photos, signatures)
3. Ensure "Public bucket" is enabled

---

## Usage Examples

### 1. Upload Contract Photos

```typescript
import { PhotoStorageService } from '../services/photo-storage.service';

// During contract creation/editing
async function handlePhotoCaptured(photoUri: string, index: number) {
  try {
    // Upload photo to storage
    const result = await PhotoStorageService.uploadContractPhoto(
      contractId,
      photoUri,
      index
    );

    console.log('Photo uploaded:', result.url);
    
    // result contains:
    // - url: Public URL to access the photo
    // - path: Storage path (e.g., "contractId/photo_0_1234567890.jpg")
    // - size: File size in bytes

    // Metadata is automatically saved to the photos table
  } catch (error) {
    Alert.alert('Σφάλμα', 'Αποτυχία μεταφόρτωσης φωτογραφίας');
  }
}
```

### 2. Upload Multiple Contract Photos at Once

```typescript
async function saveContractWithPhotos(contract: Contract, photoUris: string[]) {
  try {
    // First save the contract
    const savedContract = await SupabaseContractService.saveContract(contract);
    
    // Then upload all photos
    const uploadResults = await PhotoStorageService.uploadContractPhotos(
      savedContract.id,
      photoUris
    );
    
    console.log(`Uploaded ${uploadResults.length} photos`);
    
    return savedContract;
  } catch (error) {
    console.error('Error saving contract with photos:', error);
    throw error;
  }
}
```

### 3. Display Contract Photos

```typescript
import { Image } from 'react-native';

function ContractPhotosGallery({ contractId }: { contractId: string }) {
  const [photos, setPhotos] = useState<any[]>([]);

  useEffect(() => {
    loadPhotos();
  }, [contractId]);

  async function loadPhotos() {
    const photoRecords = await PhotoStorageService.getContractPhotos(contractId);
    setPhotos(photoRecords);
  }

  return (
    <View>
      {photos.map((photo, index) => (
        <Image
          key={photo.id}
          source={{ uri: photo.photo_url }}
          style={{ width: 100, height: 100, margin: 4 }}
        />
      ))}
    </View>
  );
}
```

### 4. Upload Car/Vehicle Photo

```typescript
// Upload general car photo
async function handleCarPhotoCapture(vehicleId: string, photoUri: string) {
  const result = await PhotoStorageService.uploadCarPhoto(
    vehicleId,
    photoUri,
    'exterior' // Type: 'exterior', 'interior', 'general', etc.
  );
  
  console.log('Car photo uploaded:', result.url);
}
```

### 5. Upload Damage Photo

```typescript
// Upload photo of vehicle damage
async function handleDamagePhotoCapture(
  vehicleId: string,
  damageId: string,
  photoUri: string
) {
  const result = await PhotoStorageService.uploadDamagePhoto(
    vehicleId,
    damageId,
    photoUri
  );
  
  console.log('Damage photo uploaded:', result.url);
}
```

### 6. Upload Signature

```typescript
import { SignaturePad } from '../components/signature-pad';

async function handleSignatureSaved(signatureUri: string) {
  const user = await AuthService.getCurrentUser();
  
  const result = await PhotoStorageService.uploadSignature(
    user.id,
    signatureUri,
    'client' // 'user' or 'client'
  );
  
  // Save signature URL to contract
  setClientSignatureUrl(result.url);
}
```

### 7. Delete Contract Photos

```typescript
async function handleDeleteContract(contractId: string) {
  // This deletes both from storage AND database
  await PhotoStorageService.deleteContractPhotos(contractId);
  
  // Then delete the contract
  await SupabaseContractService.deleteContract(contractId);
}
```

---

## Integration with Existing Components

### Update Photo Capture Component

**File: `components/photo-capture.tsx`**

```typescript
import { PhotoStorageService } from '../services/photo-storage.service';

// In your component:
async function handleCapturePhoto() {
  // Existing photo capture code...
  const photo = await capturePhotoAsync();
  
  // NEW: Upload to Supabase Storage instead of keeping locally
  if (contractId) {
    try {
      const result = await PhotoStorageService.uploadContractPhoto(
        contractId,
        photo.uri,
        photoIndex
      );
      
      // Store the public URL instead of local URI
      onPhotoCapture(result.url);
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία μεταφόρτωσης φωτογραφίας');
    }
  }
}
```

### Update Contract Save Logic

**File: `app/new-contract.tsx`**

```typescript
async function saveContract() {
  setIsSaving(true);
  
  try {
    // Create contract object
    const contract: Contract = {
      id: generateUUID(),
      userId,
      renterInfo,
      rentalPeriod,
      carInfo,
      carCondition,
      damagePoints,
      photoUris: [], // Will be filled by storage service
      clientSignature: clientSignatureUrl, // From storage
      status: 'upcoming',
      createdAt: new Date(),
    };
    
    // Save contract to database
    const savedContract = await SupabaseContractService.saveContract(contract);
    
    // Upload photos if any
    if (localPhotoUris.length > 0) {
      await PhotoStorageService.uploadContractPhotos(
        savedContract.id,
        localPhotoUris
      );
    }
    
    Alert.alert('Επιτυχία', 'Το συμβόλαιο αποθηκεύτηκε επιτυχώς!');
    router.back();
  } catch (error) {
    console.error('Error saving contract:', error);
    Alert.alert('Σφάλμα', 'Αποτυχία αποθήκευσης συμβολαίου');
  } finally {
    setIsSaving(false);
  }
}
```

---

## Storage Structure

### Contract Photos
```
contract-photos/
  ├── {contract-id}/
  │   ├── photo_0_1234567890.jpg
  │   ├── photo_1_1234567891.jpg
  │   └── photo_2_1234567892.jpg
```

### Car Photos
```
car-photos/
  ├── {vehicle-id}/
  │   ├── exterior_1234567890.jpg
  │   ├── interior_1234567891.jpg
  │   ├── damage_{damage-id}_1234567892.jpg
  │   └── general_1234567893.jpg
```

### Signatures
```
signatures/
  ├── {user-id}/
  │   ├── user_signature_1234567890.png
  │   └── client_signature_1234567891.png
```

---

## Database Integration

### Photos Table

The `photos` table automatically stores metadata:

```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id),
  photo_url TEXT NOT NULL,      -- Public URL from Supabase Storage
  storage_path TEXT NOT NULL,   -- Path in storage bucket
  file_size INTEGER,            -- File size in bytes
  mime_type TEXT,               -- image/jpeg
  order_index INTEGER,          -- Photo order (0, 1, 2...)
  created_at TIMESTAMP
);
```

### Querying Photos

```typescript
// Get all photos for a contract
const photos = await PhotoStorageService.getContractPhotos(contractId);

// photos is an array of:
// [
//   {
//     id: "uuid",
//     contract_id: "contract-uuid",
//     photo_url: "https://...supabase.co/.../photo.jpg",
//     storage_path: "contract-id/photo_0_timestamp.jpg",
//     file_size: 123456,
//     mime_type: "image/jpeg",
//     order_index: 0,
//     created_at: "2025-10-22T10:00:00Z"
//   },
//   ...
// ]
```

---

## Error Handling

### Common Issues and Solutions

**Issue 1: "Upload failed: new row violates row-level security policy"**
- Solution: Run `storage-policies-update.sql` to set up RLS policies
- Verify user is authenticated

**Issue 2: "File not found" when trying to upload**
- Solution: Check that `photoUri` exists and is accessible
- Verify file permissions in expo

**Issue 3: Photos not displaying**
- Solution: Check that buckets are set to "public"
- Verify the photo URL is correct
- Check network connectivity

**Issue 4: Slow uploads**
- Solution: Compress images before upload
- Show loading indicator to user
- Consider uploading in background

### Example Error Handling

```typescript
async function uploadPhotoWithRetry(
  contractId: string,
  photoUri: string,
  index: number,
  maxRetries: number = 3
): Promise<UploadResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await PhotoStorageService.uploadContractPhoto(
        contractId,
        photoUri,
        index
      );
    } catch (error) {
      lastError = error as Error;
      console.log(`Upload attempt ${attempt + 1} failed, retrying...`);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  throw new Error(`Upload failed after ${maxRetries} attempts: ${lastError?.message}`);
}
```

---

## Performance Optimization

### 1. Image Compression

```typescript
import * as ImageManipulator from 'expo-image-manipulator';

async function compressImage(uri: string): Promise<string> {
  const manipResult = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }], // Resize to max width 1200px
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  
  return manipResult.uri;
}

// Use before uploading:
const compressedUri = await compressImage(originalUri);
await PhotoStorageService.uploadContractPhoto(contractId, compressedUri, index);
```

### 2. Background Upload Queue

```typescript
// Upload photos in the background while user continues
async function uploadPhotosInBackground(contractId: string, photoUris: string[]) {
  // Show notification that upload is in progress
  Toast.show('Μεταφόρτωση φωτογραφιών...');
  
  // Upload asynchronously
  PhotoStorageService.uploadContractPhotos(contractId, photoUris)
    .then(results => {
      Toast.show(`${results.length} φωτογραφίες μεταφορτώθηκαν!`);
    })
    .catch(error => {
      Toast.show('Κάποιες φωτογραφίες απέτυχαν');
    });
}
```

### 3. Lazy Loading Images

```typescript
import { Image } from 'expo-image';

function OptimizedImage({ uri }: { uri: string }) {
  return (
    <Image
      source={{ uri }}
      placeholder={blurhash} // Optional placeholder
      contentFit="cover"
      transition={200}
      style={{ width: 100, height: 100 }}
    />
  );
}
```

---

## Testing

### Test Checklist

- [ ] Can upload contract photo successfully
- [ ] Photo appears in Supabase Storage dashboard
- [ ] Photo metadata saved to photos table
- [ ] Can view uploaded photos in app
- [ ] Can upload car photos
- [ ] Can upload damage photos
- [ ] Can upload signatures
- [ ] Can delete photos (removes from storage and database)
- [ ] Photos display correctly after upload
- [ ] Upload works on slow network
- [ ] Error messages show for failed uploads

### Manual Testing Steps

1. **Test Contract Photo Upload:**
   ```
   - Create new contract
   - Take photo with camera
   - Verify photo uploads
   - Check Supabase Storage for file
   - Check photos table for metadata
   ```

2. **Test Photo Display:**
   ```
   - View saved contract
   - Verify photos display
   - Check photo order is correct
   - Test on slow network
   ```

3. **Test Photo Deletion:**
   ```
   - Delete a contract
   - Verify photos removed from storage
   - Verify metadata removed from database
   ```

---

## Migration from Local Storage

If you have existing photos stored locally, here's how to migrate:

```typescript
async function migrateLocalPhotosToStorage() {
  // Get all contracts with local photo URIs
  const contracts = await SupabaseContractService.getAllContracts();
  
  for (const contract of contracts) {
    if (contract.photoUris && contract.photoUris.length > 0) {
      try {
        // Check if photos are local URIs
        const localPhotos = contract.photoUris.filter(uri => 
          uri.startsWith('file://') || uri.startsWith('content://')
        );
        
        if (localPhotos.length > 0) {
          console.log(`Migrating ${localPhotos.length} photos for contract ${contract.id}`);
          
          // Upload to storage
          const results = await PhotoStorageService.uploadContractPhotos(
            contract.id,
            localPhotos
          );
          
          console.log(`Migrated ${results.length} photos`);
        }
      } catch (error) {
        console.error(`Failed to migrate photos for contract ${contract.id}:`, error);
      }
    }
  }
  
  console.log('Migration complete!');
}
```

---

## Summary

### What You Get:
✅ Centralized photo storage in Supabase  
✅ Automatic metadata tracking  
✅ Public URLs for easy access  
✅ Organized folder structure  
✅ Easy deletion and management  
✅ Proper RLS security  

### Implementation Status:
✅ PhotoStorageService created  
✅ SQL policies ready  
✅ Usage examples documented  
🚧 Update components to use service  
🚧 Test in production  

### Next Steps:
1. Run `storage-policies-update.sql` in Supabase
2. Update photo capture components
3. Update contract save logic
4. Test thoroughly
5. Deploy to production

