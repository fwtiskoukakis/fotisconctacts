/**
 * Script to check AADE configuration
 * Run with: npx ts-node scripts/check-aade-config.ts
 */

// Check environment variables
const requiredEnvVars = [
  'EXPO_PUBLIC_AADE_USER_ID',
  'EXPO_PUBLIC_AADE_SUBSCRIPTION_KEY',
  'EXPO_PUBLIC_COMPANY_VAT_NUMBER',
  'EXPO_PUBLIC_AADE_ENVIRONMENT',
];

const optionalEnvVars = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
];

console.log('🔍 Checking AADE Configuration...\n');

let hasErrors = false;

// Check required variables
console.log('📋 Required Variables:');
requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✓ ${varName}: ${maskSensitive(value)}`);
  } else {
    console.log(`  ✗ ${varName}: MISSING`);
    hasErrors = true;
  }
});

console.log('\n📋 Optional Variables:');
optionalEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✓ ${varName}: ${maskSensitive(value)}`);
  } else {
    console.log(`  ○ ${varName}: Not set`);
  }
});

// Validate VAT number format
console.log('\n🔐 Validating Configuration:');

const vatNumber = process.env.EXPO_PUBLIC_COMPANY_VAT_NUMBER;
if (vatNumber) {
  if (/^\d{9}$/.test(vatNumber)) {
    console.log(`  ✓ VAT number format is valid (9 digits)`);
  } else {
    console.log(`  ✗ VAT number format is invalid (must be 9 digits)`);
    hasErrors = true;
  }
}

const environment = process.env.EXPO_PUBLIC_AADE_ENVIRONMENT;
if (environment) {
  if (environment === 'development' || environment === 'production') {
    console.log(`  ✓ Environment is valid: ${environment}`);
  } else {
    console.log(`  ✗ Environment must be 'development' or 'production'`);
    hasErrors = true;
  }
}

// Show base URL
console.log('\n🌐 AADE Base URL:');
if (environment === 'production') {
  console.log('  → https://mydatapi.aade.gr/DCL/');
} else {
  console.log('  → https://mydataapidev.aade.gr/DCL/');
}

// Final status
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Configuration has errors. Please fix them before using AADE.');
  process.exit(1);
} else {
  console.log('✅ Configuration is valid. AADE integration is ready to use.');
  process.exit(0);
}

/**
 * Mask sensitive values for display
 */
function maskSensitive(value: string): string {
  if (value.length <= 8) {
    return '***';
  }
  return value.substring(0, 4) + '***' + value.substring(value.length - 4);
}

