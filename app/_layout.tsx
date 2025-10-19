import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors, Typography } from 'react-native-ui-lib';
import { initializeAADE } from '../utils/aade-config';
import { AuthService } from '../services/auth.service';

// Configure React Native UI Lib
Colors.loadColors({
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#5AC8FA',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  borderLight: '#E5E5EA',
});

Typography.loadTypographies({
  h1: { fontSize: 34, fontWeight: 'bold' },
  h2: { fontSize: 28, fontWeight: 'bold' },
  h3: { fontSize: 22, fontWeight: '600' },
  h4: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  bodyLarge: { fontSize: 18, fontWeight: '400' },
  bodyMedium: { fontSize: 16, fontWeight: '400' },
  bodySmall: { fontSize: 14, fontWeight: '400' },
  bodyXSmall: { fontSize: 12, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
});

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
      router.replace('/(tabs)/');
    }
  }, [isAuthenticated, segments, isAuthInitialized]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="auth/sign-in" />
          <Stack.Screen name="auth/sign-up" />
          <Stack.Screen name="auth/reset-password" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="new-contract" />
          <Stack.Screen name="contract-details" />
          <Stack.Screen name="edit-contract" />
          <Stack.Screen name="car-details" />
          <Stack.Screen name="user-management" />
          <Stack.Screen name="aade-settings" />
          <Stack.Screen name="notifications" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

