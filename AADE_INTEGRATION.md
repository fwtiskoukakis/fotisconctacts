# AADE Digital Client API - Quick Reference

## 🚀 Quick Start

### 1. Add to .env
```env
EXPO_PUBLIC_AADE_USER_ID=your_user_id
EXPO_PUBLIC_AADE_SUBSCRIPTION_KEY=your_subscription_key
EXPO_PUBLIC_COMPANY_VAT_NUMBER=123456789
EXPO_PUBLIC_AADE_ENVIRONMENT=development
```

### 2. Initialize in App
```typescript
// In app/_layout.tsx
import { initializeAADE } from '../utils/aade-config';

useEffect(() => {
  initializeAADE();
}, []);
```

### 3. Update Database
```sql
-- In Supabase SQL Editor
-- Run: supabase/aade-schema-update.sql
```

## 📝 Usage Examples

### Create Contract with AADE
```typescript
import { createContractWithAADE } from '../utils/aade-contract-helper';

// After saving contract to database
const result = await createContractWithAADE(contract, contractId);

if (result.success) {
  Alert.alert('Επιτυχία', `Καταχωρήθηκε στο AADE με ID: ${result.aadeDclId}`);
} else {
  Alert.alert('Σφάλμα AADE', result.error);
}
```

### Complete Rental
```typescript
import { completeRentalWithAADE } from '../utils/aade-contract-helper';

const result = await completeRentalWithAADE({
  contractId: contract.id,
  aadeDclId: contract.aade_dcl_id!,
  finalAmount: 150.00,
  finalMileage: 15500,
  hasInvoice: true,
});
```

### Cancel Rental
```typescript
import { cancelRentalWithAADE } from '../utils/aade-contract-helper';

const result = await cancelRentalWithAADE(contractId, aadeDclId);
```

### Validate VAT
```typescript
import { validateGreekVAT, formatVATNumber } from '../utils/aade-contract-helper';

const validation = validateGreekVAT(vatNumber);
if (!validation.isValid) {
  Alert.alert('Σφάλμα', validation.error);
}

const formatted = formatVATNumber('123456789'); // "123-456-789"
```

## 📊 AADE Status Display

```typescript
import { getAADEStatusMessage } from '../utils/aade-contract-helper';

const statusInfo = getAADEStatusMessage(contract.aade_status);

<View style={{ backgroundColor: statusInfo.color }}>
  <Text>{statusInfo.icon} {statusInfo.text}</Text>
</View>
```

## 🔄 Workflow Integration

### New Contract Screen
```typescript
async function handleSaveContract() {
  // 1. Validate VAT
  const vatValidation = validateGreekVAT(renterInfo.taxId);
  if (!vatValidation.isValid) {
    Alert.alert('Σφάλμα', vatValidation.error);
    return;
  }

  // 2. Save to database
  const { id } = await SupabaseContractService.saveContract({ contract });

  // 3. Submit to AADE
  const aadeResult = await createContractWithAADE(contract, id);
  
  if (!aadeResult.success) {
    Alert.alert('Προειδοποίηση', 
      `Το συμβόλαιο αποθηκεύτηκε αλλά δεν καταχωρήθηκε στο AADE: ${aadeResult.error}`
    );
  }
}
```

### Contract Details Screen
```typescript
function ContractDetailsScreen({ contract }) {
  const statusInfo = getAADEStatusMessage(contract.aade_status);

  return (
    <View>
      {/* AADE Status Badge */}
      <View style={[styles.badge, { backgroundColor: statusInfo.color }]}>
        <Text>{statusInfo.icon} {statusInfo.text}</Text>
      </View>

      {/* AADE DCL ID */}
      {contract.aade_dcl_id && (
        <Text>AADE DCL ID: {contract.aade_dcl_id}</Text>
      )}

      {/* Error Message */}
      {contract.aade_status === 'error' && (
        <Text style={styles.error}>{contract.aade_error_message}</Text>
      )}

      {/* Actions */}
      {contract.aade_status === 'error' && (
        <Button 
          title="Επανυποβολή στο AADE"
          onPress={handleResubmit}
        />
      )}
    </View>
  );
}
```

## 🔐 Environment Setup

### Development
```env
EXPO_PUBLIC_AADE_ENVIRONMENT=development
```
- Base URL: `https://mydataapidev.aade.gr/DCL/`
- Use test credentials
- No real data sent to AADE

### Production
```env
EXPO_PUBLIC_AADE_ENVIRONMENT=production
```
- Base URL: `https://mydatapi.aade.gr/DCL/`
- Use production credentials
- Real submissions to AADE

## ⚠️ Error Handling

### Display User-Friendly Errors
```typescript
function getErrorMessage(error: string): string {
  if (error.includes('Invalid VAT')) {
    return 'Το ΑΦΜ του πελάτη δεν είναι έγκυρο';
  }
  if (error.includes('already completed')) {
    return 'Το συμβόλαιο έχει ήδη ολοκληρωθεί στο AADE';
  }
  if (error.includes('already cancelled')) {
    return 'Το συμβόλαιο έχει ήδη ακυρωθεί στο AADE';
  }
  return `Σφάλμα AADE: ${error}`;
}
```

### Retry Failed Submissions
```typescript
async function retryFailedSubmissions() {
  const { data: failedContracts } = await supabase
    .from('contracts')
    .select('*')
    .eq('aade_status', 'error');

  for (const contract of failedContracts || []) {
    const result = await createContractWithAADE(
      mapDatabaseToContract(contract),
      contract.id
    );
    
    console.log(`Contract ${contract.id}: ${result.success ? 'Success' : 'Failed'}`);
  }
}
```

## 📦 Database Queries

### Get Pending Submissions
```typescript
const { data } = await supabase
  .from('contracts')
  .select('*')
  .or('aade_status.is.null,aade_status.eq.pending')
  .order('created_at', { ascending: false });
```

### Get AADE Statistics
```typescript
const { data } = await supabase
  .from('contracts')
  .select('aade_status')
  .gte('created_at', startDate.toISOString());

const stats = {
  submitted: data?.filter(c => c.aade_status === 'submitted').length || 0,
  completed: data?.filter(c => c.aade_status === 'completed').length || 0,
  errors: data?.filter(c => c.aade_status === 'error').length || 0,
  pending: data?.filter(c => !c.aade_status || c.aade_status === 'pending').length || 0,
};
```

## 🎯 Key Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `initializeAADE()` | Setup AADE service | void |
| `isAADEConfigured()` | Check if configured | boolean |
| `createContractWithAADE()` | Submit new contract | { success, aadeDclId, error } |
| `completeRentalWithAADE()` | Mark rental complete | { success, error } |
| `cancelRentalWithAADE()` | Cancel contract | { success, error } |
| `correlateInvoiceWithAADE()` | Link invoice | { success, error } |
| `validateGreekVAT()` | Validate VAT format | { isValid, error } |
| `getAADEStatusMessage()` | UI status info | { text, color, icon } |
| `canSubmitToAADE()` | Pre-submission check | { canSubmit, reason } |

## 📚 Documentation Files

- **`supabase/AADE_SETUP.md`** - Complete setup guide
- **`models/aade.types.ts`** - TypeScript type definitions
- **`services/aade.service.ts`** - Core AADE API client
- **`services/aade-integration.service.ts`** - Business logic
- **`utils/aade-config.ts`** - Configuration helper
- **`utils/aade-contract-helper.ts`** - UI helper functions

## ⚡ Performance Tips

1. **Async Operations** - Don't block UI during AADE calls
2. **Error Recovery** - Retry with exponential backoff
3. **Batch Processing** - Use sync functions for multiple contracts
4. **Status Monitoring** - Create dashboard for AADE status
5. **Local Queue** - Queue failed submissions for retry

## 🧪 Testing Checklist

- [ ] Create contract with valid VAT
- [ ] Create contract with invalid VAT
- [ ] Complete rental
- [ ] Cancel rental
- [ ] Correlate with invoice
- [ ] Handle AADE errors
- [ ] Retry failed submission
- [ ] Test in development environment
- [ ] Test in production environment
- [ ] Monitor AADE dashboard

## 🆘 Troubleshooting

### Issue: "AADE Service not initialized"
**Solution:** Call `initializeAADE()` at app startup

### Issue: "Invalid VAT number"
**Solution:** Validate VAT is exactly 9 digits

### Issue: HTTP 401 Unauthorized
**Solution:** Check `AADE_USER_ID` and `SUBSCRIPTION_KEY`

### Issue: "Already completed"
**Solution:** Don't retry completed contracts

### Issue: Network timeout
**Solution:** Check internet connection, retry with backoff

## 📞 Support

- **AADE Portal**: https://www.aade.gr/mydata
- **Developer Registration**: https://mydata-dev-register.azurewebsites.net
- **Full Documentation**: See `supabase/AADE_SETUP.md`

