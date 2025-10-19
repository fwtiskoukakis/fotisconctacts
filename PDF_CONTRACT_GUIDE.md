# 📄 Professional PDF Contract Generation Guide

## 🎨 Overview

A **beautiful**, **professional** PDF contract generation system with:
- ✅ Modern iOS 26 Liquid Glass design
- ✅ AGGELOS Rentals branding
- ✅ QR code for digital verification
- ✅ Damage photos integration
- ✅ Bilingual support (Greek/English)
- ✅ AADE (myDATA) integration status display
- ✅ Digital signatures
- ✅ Complete Terms & Conditions

---

## 📦 Installation

All required dependencies are already included:
- ✅ `expo-print` - PDF generation
- ✅ `expo-sharing` - Share PDFs
- ✅ `expo-file-system` - File operations
- ✅ `date-fns` - Date formatting

---

## 🚀 Quick Start

### **1. Basic Usage**

```typescript
import { PDFContractGenerator } from '../components/pdf-contract-generator';

<PDFContractGenerator
  contract={contract}
  user={currentUser}
/>
```

That's it! The component handles everything.

---

## 🎯 Features

### **1. Main Generate Button**
- Big, beautiful button with PDF icon
- Click to open advanced options modal
- Shows loading state during generation

### **2. Quick Generate Buttons**
- **Γρήγορη Δημιουργία**: Instant Greek PDF with all features
- **English Version**: Instant English PDF

### **3. Advanced Options Modal**

#### **Language Selection** 🌍
- Greek (Ελληνικά) - Full Greek translation
- English - Full English translation

#### **Content Options** ✅
- **Φωτογραφίες Οχήματος**: Include all vehicle photos
- **Καταγεγραμμένες Ζημιές**: Include damage points list
- **QR Code Επαλήθευσης**: Add verification QR code

#### **Preview Section** 👁️
- See contract details before generation
- Renter name, vehicle, total cost

---

## 📑 PDF Layout

### **Page 1: Contract Details**

```
┌──────────────────────────────────┐
│  AGGELOS RENTALS (Logo & Info)  │
│  Contract #ABC123 | QR Code      │
│  AADE Badge (if submitted)       │
├──────────────────────────────────┤
│  📊 RENTAL SUMMARY BANNER        │
│  Days | Total Cost | Insurance   │
├──────────────────────────────────┤
│  🚗 VEHICLE CARD                 │
│  Make/Model | Plate | Year       │
│  Mileage | Fuel Gauge            │
├──────────────────────────────────┤
│  👤 RENTER INFORMATION GRID      │
│  Name | ID | Tax ID | License    │
│  Phone | Email | Address         │
├──────────────────────────────────┤
│  📅 RENTAL PERIOD                │
│  Pickup: Date | Time | Location  │
│  Return: Date | Time | Location  │
├──────────────────────────────────┤
│  ⚠️ DAMAGE POINTS (if any)       │
│  Grid showing all damages        │
├──────────────────────────────────┤
│  📷 VEHICLE PHOTOS (2x3 grid)    │
├──────────────────────────────────┤
│  ✍️ DIGITAL SIGNATURES           │
│  Client | Agent                  │
├──────────────────────────────────┤
│  Footer: Contact & ID            │
└──────────────────────────────────┘
```

### **Page 2: Terms & Conditions**

Full legal terms in beautiful, readable format:
1. General Terms
2. Driver Requirements
3. Insurance Coverage
4. Fuel & Mileage
5. Usage Restrictions
6. Recorded Damages
7. Vehicle Return
8. Renter Liability
9. Cancellations & Changes
10. Personal Data Protection
11. myDATA (AADE) Integration

**Plus signature fields for acceptance**

---

## 🎨 Design Highlights

### **Modern iOS 26 Aesthetic**
- Translucent glass effects
- Soft shadows
- Rounded corners
- Professional color scheme

### **Information Hierarchy**
- Clear section headers with icons
- Color-coded badges
- Grid layouts for data
- Visual fuel gauge

### **Branding**
- AGGELOS RENTALS logo & colors
- Company contact information
- Professional footer
- QR code for verification

### **AADE Integration**
- Green badge showing submission status
- DCL ID display
- "Uploaded to AADE" indicator
- Terms section about myDATA

---

## 💻 Integration Examples

### **Example 1: In Contract Details Page**

```typescript
// app/contract-details.tsx
import { PDFContractGenerator } from '../components/pdf-contract-generator';

export default function ContractDetailsScreen() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // ... load contract and user ...

  return (
    <ScrollView>
      {/* Contract info */}
      
      {/* PDF Generator */}
      {contract && user && (
        <PDFContractGenerator
          contract={contract}
          user={user}
          style={{ marginTop: 20 }}
        />
      )}
    </ScrollView>
  );
}
```

### **Example 2: Direct Service Usage**

```typescript
import { PDFContractProService } from '../services/pdf-contract-pro.service';

// Generate PDF with custom options
const pdfUri = await PDFContractProService.generateProfessionalContract(
  contract,
  user,
  {
    language: 'el',
    includePhotos: true,
    includeDamages: true,
    includeQRCode: true,
  }
);

// Share the PDF
await PDFContractProService.sharePDF(pdfUri, contract.id);
```

### **Example 3: Batch Generation**

```typescript
// Generate PDFs for multiple contracts
const contracts = await getContracts();

for (const contract of contracts) {
  const pdfUri = await PDFContractProService.generateProfessionalContract(
    contract,
    user,
    { language: 'el', includePhotos: false }
  );
  
  // Upload to Supabase or email to customer
}
```

---

## 🛠️ Customization

### **Update Company Branding**

Edit `services/pdf-contract-pro.service.ts`:

```typescript
// Line ~80: Company Information
<div class="company-details">
  <strong>VAT:</strong> YOUR_VAT_NUMBER<br/>
  <strong>MHTE:</strong> YOUR_MHTE_NUMBER<br/>
  <strong>Διεύθυνση:</strong> YOUR_ADDRESS<br/>
  <strong>Τηλ:</strong> YOUR_PHONE_NUMBERS<br/>
  <strong>Email:</strong> YOUR_EMAIL<br/>
  <strong>Web:</strong> YOUR_WEBSITE
</div>
```

### **Add Logo**

Replace the logo section with your base64 logo:

```typescript
// Line ~15
private static readonly LOGO_BASE64 = 'data:image/png;base64,YOUR_BASE64_LOGO';

// Use in HTML:
<img src="${this.LOGO_BASE64}" style="width: 120px;"/>
```

### **Modify Terms**

Edit the terms in the `generateGreekContractHTML` method (Page 2 section).

### **Change Colors**

```css
/* Primary Color */
color: #007AFF; /* Change to your brand color */
background: linear-gradient(135deg, #007AFF 0%, #0056b3 100%);

/* Success/AADE Color */
background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
```

---

## 📤 Sharing & Export

### **Built-in Share Function**

The component automatically offers to share after generation:
- Email attachment
- WhatsApp
- Save to Files
- Print
- AirDrop (iOS)
- Nearby Share (Android)

### **Upload to Supabase**

Uncomment this line in `generateProfessionalContract`:

```typescript
// Upload to Supabase Storage (optional)
await this.uploadToSupabase(uri, contract.id);
```

Then access via:
```typescript
const publicUrl = `https://your-project.supabase.co/storage/v1/object/public/contracts/contract_${contractId}.pdf`;
```

### **Email to Customer**

```typescript
import * as MailComposer from 'expo-mail-composer';

const pdfUri = await PDFContractProService.generateProfessionalContract(...);

await MailComposer.composeAsync({
  recipients: [contract.renterInfo.email],
  subject: `Συμβόλαιο Ενοικίασης #${contract.id.substring(0, 8)}`,
  body: 'Σας αποστέλλουμε το συμβόλαιο ενοικίασης...',
  attachments: [pdfUri],
});
```

---

## 🔍 QR Code Verification

The QR code links to:
```
https://antiparosrentacar.com/verify/${contractId}
```

### **Setup Verification Page**

Create a public verification page that:
1. Reads the contract ID from URL
2. Fetches basic contract info (no personal data)
3. Shows verification status
4. Displays AADE submission status

Example:
```typescript
// app/(public)/verify/[id].tsx
export default function VerifyContract() {
  const { id } = useParams();
  
  // Fetch public contract data
  const contract = await fetchContractPublic(id);
  
  return (
    <View>
      <Text>✅ Contract Verified</Text>
      <Text>Vehicle: {contract.carInfo.makeModel}</Text>
      <Text>Period: {contract.rentalPeriod.pickupDate}</Text>
      <Text>AADE Status: {contract.aadeStatus}</Text>
    </View>
  );
}
```

---

## 🐛 Troubleshooting

### **Issue: PDF not generating**

**Solution**: Check file permissions
```typescript
import * as FileSystem from 'expo-file-system';

const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
```

### **Issue: Photos not appearing**

**Solution**: Ensure photo URIs are accessible
```typescript
// Convert to base64 if needed
const base64 = await FileSystem.readAsStringAsync(photoUri, {
  encoding: FileSystem.EncodingType.Base64,
});
const dataUri = `data:image/jpeg;base64,${base64}`;
```

### **Issue: Signatures missing**

**Solution**: Verify signature format
```typescript
// Signatures should be:
// - Base64 data URI: data:image/png;base64,iVBOR...
// - Public URL: https://...
// - SVG string: <svg>...</svg>
```

### **Issue: QR code not showing**

**Solution**: Check network connection for QR API or use local generation:
```bash
npm install qrcode
```

```typescript
import QRCode from 'qrcode';

const qrDataUrl = await QRCode.toDataURL(`https://.../${contractId}`);
```

---

## 📊 Performance Tips

### **1. Reduce Photo Size**

```typescript
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const resized = await manipulateAsync(
  photoUri,
  [{ resize: { width: 800 } }],
  { compress: 0.7, format: SaveFormat.JPEG }
);
```

### **2. Cache Generated PDFs**

```typescript
const cacheKey = `pdf_${contract.id}_${contract.updatedAt}`;
const cached = await AsyncStorage.getItem(cacheKey);

if (cached) {
  return cached; // Return cached URI
}

// Generate and cache
const uri = await generatePDF();
await AsyncStorage.setItem(cacheKey, uri);
```

### **3. Background Generation**

```typescript
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

TaskManager.defineTask('GENERATE_PDFS', async () => {
  // Generate PDFs in background
});
```

---

## 🚀 Advanced Features

### **1. Bulk PDF Generation**

Generate PDFs for multiple contracts:
```typescript
async function generateBulkPDFs(contracts: Contract[]) {
  const results = await Promise.all(
    contracts.map(contract => 
      PDFContractProService.generateProfessionalContract(contract, user)
    )
  );
  return results;
}
```

### **2. Email Automation**

Automatically email PDF to customer:
```typescript
const pdfUri = await generatePDF();
await EmailService.sendContractToCustomer(contract, pdfUri);
```

### **3. Cloud Backup**

Auto-upload to cloud storage:
```typescript
await uploadToSupabase(pdfUri, contract.id);
await uploadToGoogleDrive(pdfUri, contract.id);
await uploadToDropbox(pdfUri, contract.id);
```

### **4. Digital Signing Integration**

Integrate with DocuSign or Adobe Sign:
```typescript
const pdfUri = await generatePDF();
const signingUrl = await DocuSign.createEnvelope(pdfUri, [
  { email: contract.renterInfo.email, name: contract.renterInfo.fullName }
]);
```

---

## 📱 Mobile vs Web

### **Mobile (iOS/Android)**
✅ Full support
✅ Native share sheet
✅ Local file storage
✅ Fast generation

### **Web**
✅ PDF generation works
✅ Download link
⚠️ Share limited (download only)
⚠️ File system limited

---

## 🎉 Result

You now have a **professional**, **beautiful** PDF contract system that:
- ✅ Looks amazing
- ✅ Is fully branded
- ✅ Includes all necessary information
- ✅ Has QR verification
- ✅ Shows AADE status
- ✅ Supports bilingual output
- ✅ Is easy to use
- ✅ Is production-ready

**Your contracts will look better than 99% of rental companies!** 🏆

