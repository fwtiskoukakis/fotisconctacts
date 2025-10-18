import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeAADE } from '../utils/aade-config';
import { AuthService } from '../services/auth.service';

/**
 * Root layout component with authentication protection
 */
export default function RootLayout() {
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Initialize AADE service on app startup
    initializeAADE();

    // Check authentication status
    checkAuthStatus();

    // Listen to auth state changes
    const { data } = AuthService.onAuthStateChange((event, session) => {
      const isSignedIn = !!session?.user;
      setIsAuthenticated(isSignedIn);
      
      if (event === 'SIGNED_OUT') {
        router.replace('/auth/sign-in');
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  async function checkAuthStatus() {
    const user = await AuthService.getCurrentUser();
    setIsAuthenticated(!!user);
    setIsAuthInitialized(true);
  }

  useEffect(() => {
    if (!isAuthInitialized) return;

    const inAuthGroup = segments[0] === 'auth';
    const isResetPassword = segments[1] === 'reset-password';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to sign in if not authenticated
      router.replace('/auth/sign-in');
    } else if (isAuthenticated && inAuthGroup && !isResetPassword) {
      // Redirect to main app if authenticated and in auth screens (except reset-password)
      router.replace('/');
    }
  }, [isAuthenticated, segments, isAuthInitialized]);

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="auth/sign-in" />
        <Stack.Screen name="auth/sign-up" />
        <Stack.Screen name="auth/reset-password" />
        <Stack.Screen name="index" />
        <Stack.Screen name="contracts" />
        <Stack.Screen name="cars" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="damage-report" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="new-contract" />
        <Stack.Screen name="contract-details" />
        <Stack.Screen name="edit-contract" />
        <Stack.Screen name="user-management" />
      </Stack>
    </SafeAreaProvider>
  );
}

