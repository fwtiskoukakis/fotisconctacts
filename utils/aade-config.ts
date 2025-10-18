import { AADEService } from '../services/aade.service';
import { AADEConfig, AADEEnvironment } from '../models/aade.types';

/**
 * Initialize AADE service with environment configuration
 */
export function initializeAADE(): void {
  const config: AADEConfig = {
    userId: process.env.EXPO_PUBLIC_AADE_USER_ID || '',
    subscriptionKey: process.env.EXPO_PUBLIC_AADE_SUBSCRIPTION_KEY || '',
    environment: (process.env.EXPO_PUBLIC_AADE_ENVIRONMENT as AADEEnvironment) || 'development',
    entityVatNumber: process.env.EXPO_PUBLIC_COMPANY_VAT_NUMBER || '',
  };

  // Validate configuration
  if (!config.userId || !config.subscriptionKey || !config.entityVatNumber) {
    console.warn('AADE configuration incomplete. AADE integration will not work.');
    return;
  }

  AADEService.initialize(config);
  console.log(`AADE initialized in ${config.environment} mode`);
}

/**
 * Check if AADE is configured and ready
 */
export function isAADEConfigured(): boolean {
  return !!(
    process.env.EXPO_PUBLIC_AADE_USER_ID &&
    process.env.EXPO_PUBLIC_AADE_SUBSCRIPTION_KEY &&
    process.env.EXPO_PUBLIC_COMPANY_VAT_NUMBER
  );
}

