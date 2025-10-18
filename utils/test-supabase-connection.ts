import { supabase } from './supabase';

/**
 * Test the Supabase connection
 * @returns Promise with connection status
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase
      .from('_test_')
      .select('*')
      .limit(1);

    if (error && error.code !== 'PGRST204') {
      console.log('Supabase connection test:', error.message);
      return {
        success: true,
        message: 'Connected to Supabase (table not found is expected)',
      };
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase!',
    };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return {
      success: false,
      message: `Failed to connect: ${error}`,
    };
  }
}

/**
 * Get Supabase project URL (for debugging)
 */
export function getSupabaseUrl(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_URL || 'Not configured';
}

