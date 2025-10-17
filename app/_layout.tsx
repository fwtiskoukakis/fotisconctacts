import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Root layout component for the app
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
            <Stack.Screen name="index" />
            <Stack.Screen name="new-contract" />
            <Stack.Screen name="contract-details" />
            <Stack.Screen name="edit-contract" />
      </Stack>
    </SafeAreaProvider>
  );
}

