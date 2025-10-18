# AADE Digital Client API Integration

## Overview

This app integrates with AADE (Greece's Independent Authority for Public Revenue) to comply with the Digital Client Registry (Ψηφιακό Πελατολόγιο) requirements for car rental businesses.

## Prerequisites

1. **AADE Developer Account**
   - Register at: https://mydata-dev-register.azurewebsites.net
   - You'll receive:
     - User ID (`aade-user-id`)
     - Subscription Key (`ocp-apim-subscription-key`)

2. **Company VAT Number (ΑΦΜ)**
   - Your business must be registered with AADE
   - You need a valid 9-digit VAT number

## Environment Configuration

Add these variables to your `.env` file:

```env
# AADE Configuration
EXPO_PUBLIC_AADE_USER_ID=your_aade_user_id
EXPO_PUBLIC_AADE_SUBSCRIPTION_KEY=your_subscription_key
EXPO_PUBLIC_COMPANY_VAT_NUMBER=123456789
EXPO_PUBLIC_AADE_ENVIRONMENT=development
```

### Environment Values

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_AADE_USER_ID` | Your AADE username | `user@example.com` |
| `EXPO_PUBLIC_AADE_SUBSCRIPTION_KEY` | API subscription key | `abc123xyz...` |
| `EXPO_PUBLIC_COMPANY_VAT_NUMBER` | Your company's 9-digit VAT | `123456789` |
| `EXPO_PUBLIC_AADE_ENVIRONMENT` | `development` or `production` | `development` |

## Database Setup

### Update Existing Database

If you already have contracts in your database, run the update migration:

```sql
-- In Supabase SQL Editor
-- Run: supabase/aade-schema-update.sql
```

### New Installation

The AADE fields are included in the main schema (`supabase/schema.sql`).

## Integration Flow

### 1. Create Contract → Submit to AADE

When a rental contract is created:

```typescript
import { AADEIntegrationService } from './services/aade-integration.service';
import { initializeAADE } from './utils/aade-config';

// Initialize AADE (do once at app startup)
initializeAADE();

// After saving contract
const result = await AADEIntegrationService.submitContractToAADE(
  contractId,
  contract
);

if (result.success) {
  console.log(`AADE DCL ID: ${result.dclId}`);
} else {
  console.error(`AADE Error: ${result.error}`);
}
```

### 2. Complete Contract → Update AADE

When rental is completed:

```typescript
const result = await AADEIntegrationService.completeContractInAADE({
  contractId: contract.id,
  dclId: contract.aade_dcl_id!,
  finalAmount: 150.00,
  endKm: 15500,
  completionDateTime: new Date(),
  invoiceKind: 2, // 2 = Invoice, 1 = Receipt
});
```

### 3. Issue Invoice → Correlate with AADE

After issuing an invoice:

```typescript
const result = await AADEIntegrationService.correlateContractWithInvoice({
  contractId: contract.id,
  dclId: contract.aade_dcl_id!,
  invoiceMark: '400001234567890123', // myDATA invoice MARK
});
```

### 4. Cancel Contract → Cancel in AADE

If contract is cancelled:

```typescript
const result = await AADEIntegrationService.cancelContractInAADE(
  contractId,
  dclId
);
```

## AADE Status Field

Contracts have an `aade_status` field with these values:

| Status | Description |
|--------|-------------|
| `null` / `pending` | Not yet submitted to AADE |
| `submitted` | Successfully submitted to AADE |
| `completed` | Rental completed and updated in AADE |
| `cancelled` | Contract cancelled in AADE |
| `error` | Submission failed (check `aade_error_message`) |

## Error Handling

### Common AADE Errors

| Code | Error | Solution |
|------|-------|----------|
| 101 | XMLSyntaxError | Check XML format |
| 102 | Invalid VAT | Verify customer VAT is valid |
| 203 | Missing field | Ensure all required fields are present |
| 207 | Already cancelled | Don't retry cancellation |
| 209 | Already completed | Don't retry completion |

### Error Checking

```typescript
const { data: errorContracts } = await supabase
  .from('contracts')
  .select('*')
  .eq('aade_status', 'error');

// Review errors
errorContracts?.forEach(contract => {
  console.log(`Contract ${contract.id}: ${contract.aade_error_message}`);
});
```

## Bulk Operations

### Sync All Pending Contracts

```typescript
const result = await AADEIntegrationService.syncPendingContracts();

console.log(`Success: ${result.successCount}, Errors: ${result.errorCount}`);

// Review errors
result.errors.forEach(({ contractId, error }) => {
  console.log(`Contract ${contractId}: ${error}`);
});
```

## Testing

### Development Environment

1. Set `EXPO_PUBLIC_AADE_ENVIRONMENT=development`
2. Use sandbox URL: `https://mydataapidev.aade.gr/DCL/`
3. Test with development credentials

### Test Workflow

```typescript
// 1. Create test contract
const contract = createTestContract();

// 2. Submit to AADE
const submitResult = await AADEIntegrationService.submitContractToAADE(
  contract.id,
  contract
);

// 3. Check DCL ID
console.log('DCL ID:', submitResult.dclId);

// 4. Complete contract
const completeResult = await AADEIntegrationService.completeContractInAADE({
  contractId: contract.id,
  dclId: submitResult.dclId!,
  finalAmount: 100,
  endKm: 15000,
  completionDateTime: new Date(),
  invoiceKind: 2,
});

// 5. Verify status
const { data } = await supabase
  .from('contracts')
  .select('aade_status, aade_dcl_id')
  .eq('id', contract.id)
  .single();

console.log('Status:', data?.aade_status);
```

## Production Deployment

### Before Going Live

1. **Switch to Production**
   ```env
   EXPO_PUBLIC_AADE_ENVIRONMENT=production
   ```

2. **Update Credentials**
   - Use production AADE credentials
   - Verify company VAT number

3. **Test Integration**
   - Create one test rental
   - Verify AADE submission works
   - Check AADE portal for record

4. **Enable Auto-Submission**
   - Integrate AADE submission into contract creation flow
   - Handle errors gracefully
   - Log all AADE interactions

### Monitoring

Create a monitoring view:

```sql
-- Monitor AADE submissions
SELECT 
  aade_status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE aade_error_message IS NOT NULL) as errors
FROM contracts
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY aade_status;
```

## Compliance

### Legal Requirements

- All car rental businesses in Greece **must** register rentals with AADE
- Records must be submitted **before** or **during** the rental period
- Invoices must be correlated with AADE records
- Records must be kept for auditing purposes

### Record Keeping

The app automatically stores:
- AADE DCL ID
- Submission timestamps
- Update timestamps
- Invoice correlations
- Error messages

## API Endpoints Used

| Operation | Endpoint | Method |
|-----------|----------|--------|
| Create record | `/SendClient` | POST |
| Update record | `/UpdateClient` | POST |
| Cancel record | `/CancelClient` | POST |
| Retrieve records | `/RequestClients` | GET |
| Correlate invoice | `/ClientCorrelations` | POST |

## Support

- **AADE Documentation**: https://www.aade.gr/mydata
- **Developer Portal**: https://mydata-dev-register.azurewebsites.net
- **API Specification**: See AADE REST API documentation

## Troubleshooting

### "AADE Service not initialized"

Make sure to call `initializeAADE()` at app startup:

```typescript
// In App.tsx or _layout.tsx
import { initializeAADE } from './utils/aade-config';

export default function App() {
  useEffect(() => {
    initializeAADE();
  }, []);
  
  // ...
}
```

### "Invalid VAT number"

- Customer VAT must be exactly 9 digits
- No spaces or special characters
- Must be a valid Greek VAT (ΑΦΜ)

### "Unauthorized (401)"

- Check `EXPO_PUBLIC_AADE_USER_ID`
- Check `EXPO_PUBLIC_AADE_SUBSCRIPTION_KEY`
- Verify credentials in AADE portal

### Network Errors

- Check internet connection
- Verify firewall settings
- Try development environment first

## Best Practices

1. **Always validate VAT numbers** before submission
2. **Handle errors gracefully** - show user-friendly messages
3. **Log all AADE interactions** for auditing
4. **Retry failed submissions** with exponential backoff
5. **Monitor AADE status** regularly
6. **Keep AADE and local data in sync**
7. **Test in development** before using production

