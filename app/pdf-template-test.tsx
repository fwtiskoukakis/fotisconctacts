import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Contract, User } from '../models/contract.interface';
import { SupabaseContractService } from '../services/supabase-contract.service';
import { AuthService } from '../services/auth.service';
import { Colors } from '../utils/design-system';

// Import all template services
import { PDFTemplateClassic } from '../services/pdf-templates/pdf-template-classic';
import { PDFTemplateModern } from '../services/pdf-templates/pdf-template-modern';
import { PDFTemplateMinimal } from '../services/pdf-templates/pdf-template-minimal';
import { PDFTemplateElegant } from '../services/pdf-templates/pdf-template-elegant';

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  service: any;
}

const templates: TemplateOption[] = [
  {
    id: 'classic',
    name: 'Classic Business',
    description: 'Traditional professional layout with company header',
    icon: 'briefcase',
    color: '#2c3e50',
    service: PDFTemplateClassic,
  },
  {
    id: 'modern',
    name: 'Modern Clean',
    description: 'Sleek contemporary design with accent colors',
    icon: 'rocket',
    color: '#3498db',
    service: PDFTemplateModern,
  },
  {
    id: 'minimal',
    name: 'Minimal Simple',
    description: 'Clean minimalist layout, easy to read',
    icon: 'remove-circle-outline',
    color: '#95a5a6',
    service: PDFTemplateMinimal,
  },
  {
    id: 'elegant',
    name: 'Elegant Premium',
    description: 'Sophisticated design with elegant typography',
    icon: 'diamond',
    color: '#8e44ad',
    service: PDFTemplateElegant,
  },
];

/**
 * PDF Template Testing Page
 * Test different PDF templates with real contract data
 */
export default function PDFTemplateTestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const contractId = params.contractId as string || '86951486-8c18-4e1f-88e8-9baa9a25af34';
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingTemplate, setGeneratingTemplate] = useState<string | null>(null);

  React.useEffect(() => {
    loadData();
  }, [contractId]);

  async function loadData() {
    try {
      setLoading(true);
      
      // Load contract
      const c = await SupabaseContractService.getContractById(contractId);
      if (!c) {
        Alert.alert('Σφάλμα', 'Το συμβόλαιο δεν βρέθηκε');
        router.back();
        return;
      }
      setContract(c);

      // Load user
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης δεδομένων');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateTemplate(template: TemplateOption) {
    if (!contract || !user) {
      Alert.alert('Σφάλμα', 'Δεν υπάρχουν διαθέσιμα δεδομένα');
      return;
    }

    try {
      setGeneratingTemplate(template.id);
      
      // Generate PDF with selected template
      const pdfUri = await template.service.generatePDF(contract, user, {
        language: 'el',
        includePhotos: true,
        includeDamages: true,
        includeQRCode: true,
      });

      Alert.alert(
        'Επιτυχία! 🎉',
        `Το PDF με το πρότυπο "${template.name}" δημιουργήθηκε επιτυχώς!${
          pdfUri === 'web-print-initiated'
            ? '\n\nΤο PDF ανοίχτηκε σε νέο παράθυρο.'
            : '\n\nΤο PDF είναι έτοιμο για κοινοποίηση.'
        }`
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert(
        'Σφάλμα',
        `Αποτυχία δημιουργίας PDF:\n${error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}`
      );
    } finally {
      setGeneratingTemplate(null);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Φόρτωση...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>🎨 PDF Templates</Text>
            <Text style={styles.subtitle}>
              Δοκιμάστε διαφορετικά πρότυπα PDF
            </Text>
          </View>
        </View>

        {/* Contract Info */}
        {contract && (
          <View style={styles.contractInfo}>
            <View style={styles.contractInfoRow}>
              <Ionicons name="document-text" size={20} color={Colors.primary} />
              <Text style={styles.contractInfoText}>
                Συμβόλαιο: {contract.renterInfo.fullName}
              </Text>
            </View>
            <View style={styles.contractInfoRow}>
              <Ionicons name="car" size={20} color={Colors.primary} />
              <Text style={styles.contractInfoText}>
                Οχημα: {contract.carInfo.makeModel} - {contract.carInfo.licensePlate}
              </Text>
            </View>
            <Text style={styles.contractId}>ID: {contract.id}</Text>
          </View>
        )}

        {/* Templates Grid */}
        <View style={styles.templatesSection}>
          <Text style={styles.sectionTitle}>Επιλέξτε Πρότυπο</Text>
          
          {templates.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={[styles.templateCard, { borderLeftColor: template.color }]}
              onPress={() => handleGenerateTemplate(template)}
              disabled={generatingTemplate !== null}
            >
              <View style={[styles.templateIcon, { backgroundColor: template.color + '20' }]}>
                <Ionicons name={template.icon as any} size={32} color={template.color} />
              </View>
              
              <View style={styles.templateInfo}>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDescription}>{template.description}</Text>
                
                <View style={styles.templateFeatures}>
                  <View style={styles.featureBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#27ae60" />
                    <Text style={styles.featureText}>FleetOS Footer</Text>
                  </View>
                  <View style={styles.featureBadge}>
                    <Ionicons name="qr-code" size={14} color="#27ae60" />
                    <Text style={styles.featureText}>QR Code</Text>
                  </View>
                  <View style={styles.featureBadge}>
                    <Ionicons name="camera" size={14} color="#27ae60" />
                    <Text style={styles.featureText}>Photos</Text>
                  </View>
                </View>
              </View>

              {generatingTemplate === template.id ? (
                <ActivityIndicator size="small" color={template.color} />
              ) : (
                <Ionicons name="chevron-forward" size={24} color={template.color} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#3498db" />
          <Text style={styles.infoText}>
            Ολα τα πρότυπα περιλαμβάνουν:{'\n'}
            • FleetOS logo και όνομα στο footer{'\n'}
            • Contract ID ως watermark{'\n'}
            • QR code για επαλήθευση{'\n'}
            • Φωτογραφίες οχήματος{'\n'}
            • Diagram ζημιών
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  contractInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contractInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  contractInfoText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  contractId: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 8,
  },
  templatesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
  },
  templateIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  templateFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9f4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featureText: {
    fontSize: 11,
    color: '#27ae60',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1976d2',
    lineHeight: 20,
    marginLeft: 12,
  },
});

