import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/app-header';
import { ContractPhotoManager } from '../components/contract-photo-manager';
import { Colors } from '../utils/design-system';

/**
 * Test page for Contract Photo Manager
 * Navigate to: /contract-photo-test?contractId=YOUR_CONTRACT_ID
 */
export default function ContractPhotoTestScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Contract Photo Test" showBack={true} />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <ContractPhotoManager
            contractId="601ad6bd-a803-409e-984b-997c9a6b72d8" // Your test contract ID
            existingPhotos={[
              'https://kwjtqsomuwdotfkrqbne.supabase.co/storage/v1/object/public/contract-photos/contracts/382712798_6574509045930245_3159277759435415399_n.jpg'
            ]}
            onPhotosUpdated={(photos) => {
              console.log('Photos updated:', photos);
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: 16,
  },
});
