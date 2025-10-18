import { Contract } from '../models/contract.interface';
import { AADEIntegrationService } from '../services/aade-integration.service';
import { isAADEConfigured } from './aade-config';

/**
 * Helper functions for AADE integration in the contract workflow
 */

/**
 * Handle contract creation with automatic AADE submission
 */
export async function createContractWithAADE(
  contract: Contract,
  contractId: string
): Promise<{
  success: boolean;
  aadeDclId?: number;
  error?: string;
}> {
  // Check if AADE is configured
  if (!isAADEConfigured()) {
    console.warn('AADE not configured, skipping submission');
    return {
      success: true,
      error: 'AADE not configured',
    };
  }

  // Validate customer VAT
  if (!contract.renterInfo.taxId || contract.renterInfo.taxId.length !== 9) {
    return {
      success: false,
      error: 'Μη έγκυρο ΑΦΜ πελάτη. Απαιτούνται 9 ψηφία.',
    };
  }

  try {
    // Submit to AADE
    const result = await AADEIntegrationService.submitContractToAADE(
      contractId,
      contract
    );

    if (result.success) {
      return {
        success: true,
        aadeDclId: result.dclId,
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    console.error('Error in AADE submission:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Complete rental and update AADE
 */
export async function completeRentalWithAADE(params: {
  contractId: string;
  aadeDclId: number;
  finalAmount: number;
  finalMileage: number;
  hasInvoice: boolean;
}): Promise<{ success: boolean; error?: string }> {
  if (!isAADEConfigured()) {
    return { success: true };
  }

  try {
    const result = await AADEIntegrationService.completeContractInAADE({
      contractId: params.contractId,
      dclId: params.aadeDclId,
      finalAmount: params.finalAmount,
      endKm: params.finalMileage,
      completionDateTime: new Date(),
      invoiceKind: params.hasInvoice ? 2 : 1, // 2=Invoice, 1=Receipt
    });

    return result;
  } catch (error) {
    console.error('Error completing rental in AADE:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Cancel rental and notify AADE
 */
export async function cancelRentalWithAADE(
  contractId: string,
  aadeDclId: number
): Promise<{ success: boolean; error?: string }> {
  if (!isAADEConfigured()) {
    return { success: true };
  }

  if (!aadeDclId) {
    return {
      success: false,
      error: 'Δεν υπάρχει AADE DCL ID για ακύρωση',
    };
  }

  try {
    const result = await AADEIntegrationService.cancelContractInAADE(
      contractId,
      aadeDclId
    );

    return result;
  } catch (error) {
    console.error('Error cancelling rental in AADE:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Correlate issued invoice with AADE record
 */
export async function correlateInvoiceWithAADE(params: {
  contractId: string;
  aadeDclId: number;
  invoiceMark: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isAADEConfigured()) {
    return { success: true };
  }

  if (!params.aadeDclId) {
    return {
      success: false,
      error: 'Δεν υπάρχει AADE DCL ID για συσχέτιση',
    };
  }

  try {
    const result = await AADEIntegrationService.correlateContractWithInvoice({
      contractId: params.contractId,
      dclId: params.aadeDclId,
      invoiceMark: params.invoiceMark,
    });

    return result;
  } catch (error) {
    console.error('Error correlating invoice with AADE:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Get user-friendly AADE status message
 */
export function getAADEStatusMessage(
  status: string | null
): { text: string; color: string; icon: string } {
  switch (status) {
    case 'submitted':
      return {
        text: 'Καταχωρημένο στο AADE',
        color: '#28a745',
        icon: '✓',
      };
    case 'completed':
      return {
        text: 'Ολοκληρωμένο στο AADE',
        color: '#007AFF',
        icon: '✓✓',
      };
    case 'cancelled':
      return {
        text: 'Ακυρωμένο στο AADE',
        color: '#6c757d',
        icon: '✗',
      };
    case 'error':
      return {
        text: 'Σφάλμα AADE',
        color: '#dc3545',
        icon: '⚠',
      };
    case 'pending':
    case null:
      return {
        text: 'Εκκρεμεί υποβολή',
        color: '#ffc107',
        icon: '○',
      };
    default:
      return {
        text: 'Άγνωστη κατάσταση',
        color: '#6c757d',
        icon: '?',
      };
  }
}

/**
 * Validate Greek VAT number (ΑΦΜ)
 */
export function validateGreekVAT(vat: string): {
  isValid: boolean;
  error?: string;
} {
  // Remove spaces and special characters
  const cleanVAT = vat.replace(/[^0-9]/g, '');

  // Must be exactly 9 digits
  if (cleanVAT.length !== 9) {
    return {
      isValid: false,
      error: 'Το ΑΦΜ πρέπει να έχει ακριβώς 9 ψηφία',
    };
  }

  // Must be numeric
  if (!/^\d{9}$/.test(cleanVAT)) {
    return {
      isValid: false,
      error: 'Το ΑΦΜ πρέπει να περιέχει μόνο αριθμούς',
    };
  }

  return { isValid: true };
}

/**
 * Format VAT number for display
 */
export function formatVATNumber(vat: string): string {
  const clean = vat.replace(/[^0-9]/g, '');
  if (clean.length === 9) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  return vat;
}

/**
 * Check if contract can be submitted to AADE
 */
export function canSubmitToAADE(contract: Contract): {
  canSubmit: boolean;
  reason?: string;
} {
  // Check if AADE is configured
  if (!isAADEConfigured()) {
    return {
      canSubmit: false,
      reason: 'AADE δεν έχει διαμορφωθεί',
    };
  }

  // Validate customer VAT
  const vatValidation = validateGreekVAT(contract.renterInfo.taxId);
  if (!vatValidation.isValid) {
    return {
      canSubmit: false,
      reason: vatValidation.error,
    };
  }

  // Check required fields
  if (!contract.carInfo.licensePlate) {
    return {
      canSubmit: false,
      reason: 'Απαιτείται αριθμός κυκλοφορίας',
    };
  }

  if (!contract.rentalPeriod.pickupDate) {
    return {
      canSubmit: false,
      reason: 'Απαιτείται ημερομηνία παραλαβής',
    };
  }

  return { canSubmit: true };
}

