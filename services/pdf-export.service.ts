import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { Contract } from '../models/contract.interface';

export interface PDFExportOptions {
  includePhotos?: boolean;
  includeSignatures?: boolean;
  includeDamageReports?: boolean;
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

export class PDFExportService {
  /**
   * Export contract to PDF
   */
  static async exportContractToPDF(
    contract: Contract,
    options: PDFExportOptions = {}
  ): Promise<string | null> {
    try {
      const defaultOptions: PDFExportOptions = {
        includePhotos: true,
        includeSignatures: true,
        includeDamageReports: true,
        format: 'A4',
        orientation: 'portrait',
        ...options,
      };

      // Generate HTML content for the contract
      const htmlContent = this.generateContractHTML(contract, defaultOptions);
      
      // For now, we'll save as HTML file since PDF generation requires additional libraries
      // In a real implementation, you would use libraries like react-native-pdf or html-pdf
      const fileName = `contract_${contract.id}_${new Date().toISOString().split('T')[0]}.html`;
      const fileUri = `${FileSystem.documentDirectory || ''}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
        encoding: 'utf8',
      });

      return fileUri;
    } catch (error) {
      console.error('Error exporting contract to PDF:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία εξαγωγής συμβολαίου');
      return null;
    }
  }

  /**
   * Export multiple contracts to PDF
   */
  static async exportMultipleContractsToPDF(
    contracts: Contract[],
    options: PDFExportOptions = {}
  ): Promise<string | null> {
    try {
      const defaultOptions: PDFExportOptions = {
        includePhotos: false, // Disable photos for bulk export to reduce file size
        includeSignatures: true,
        includeDamageReports: false,
        format: 'A4',
        orientation: 'portrait',
        ...options,
      };

      // Generate HTML content for all contracts
      const htmlContent = this.generateMultipleContractsHTML(contracts, defaultOptions);
      
      const fileName = `contracts_${new Date().toISOString().split('T')[0]}.html`;
      const fileUri = `${FileSystem.documentDirectory || ''}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
        encoding: 'utf8',
      });

      return fileUri;
    } catch (error) {
      console.error('Error exporting multiple contracts to PDF:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία εξαγωγής συμβολαίων');
      return null;
    }
  }

  /**
   * Share exported file
   */
  static async shareExportedFile(fileUri: string): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(fileUri);
      } else {
        // For Android, you might need additional permissions
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Σφάλμα', 'Η λειτουργία κοινοποίησης δεν είναι διαθέσιμη');
        }
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία κοινοποίησης αρχείου');
    }
  }

  /**
   * Generate HTML content for a single contract
   */
  private static generateContractHTML(contract: Contract, options: PDFExportOptions): string {
    const pickupDate = new Date(contract.rentalPeriod.pickupDate).toLocaleDateString('el-GR');
    const dropoffDate = new Date(contract.rentalPeriod.dropoffDate).toLocaleDateString('el-GR');
    
    return `
<!DOCTYPE html>
<html lang="el">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Συμβόλαιο Ενοικίασης - ${contract.renterInfo.fullName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007AFF;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .section {
            margin-bottom: 25px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #007AFF;
            margin-bottom: 15px;
        }
        .field {
            margin-bottom: 10px;
        }
        .field-label {
            font-weight: bold;
            display: inline-block;
            width: 150px;
        }
        .field-value {
            display: inline-block;
        }
        .signature-section {
            margin-top: 30px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .signature-box {
            display: inline-block;
            width: 200px;
            height: 80px;
            border: 1px solid #ccc;
            margin: 10px;
            text-align: center;
            line-height: 80px;
            font-style: italic;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ΣΥΜΒΟΛΑΙΟ ΕΝΟΙΚΙΑΣΗΣ ΟΧΗΜΑΤΟΣ</h1>
        <p>Αριθμός Συμβολαίου: ${contract.id}</p>
        <p>Ημερομηνία: ${new Date().toLocaleDateString('el-GR')}</p>
    </div>

    <div class="section">
        <div class="section-title">ΣΤΟΙΧΕΙΑ ΕΝΟΙΚΙΑΣΤΗ</div>
        <div class="field">
            <span class="field-label">Ονοματεπώνυμο:</span>
            <span class="field-value">${contract.renterInfo.fullName}</span>
        </div>
        <div class="field">
            <span class="field-label">ΑΔΤ/Διαβατήριο:</span>
            <span class="field-value">${contract.renterInfo.idNumber}</span>
        </div>
        <div class="field">
            <span class="field-label">ΑΦΜ:</span>
            <span class="field-value">${contract.renterInfo.taxId}</span>
        </div>
        <div class="field">
            <span class="field-label">Τηλέφωνο:</span>
            <span class="field-value">${contract.renterInfo.phoneNumber}</span>
        </div>
        <div class="field">
            <span class="field-label">Email:</span>
            <span class="field-value">${contract.renterInfo.email}</span>
        </div>
        <div class="field">
            <span class="field-label">Διεύθυνση:</span>
            <span class="field-value">${contract.renterInfo.address}</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">ΣΤΟΙΧΕΙΑ ΟΧΗΜΑΤΟΣ</div>
        <div class="field">
            <span class="field-label">Μάρκα/Μοντέλο:</span>
            <span class="field-value">${contract.carInfo.makeModel}</span>
        </div>
        <div class="field">
            <span class="field-label">Πινακίδα:</span>
            <span class="field-value">${contract.carInfo.licensePlate}</span>
        </div>
        <div class="field">
            <span class="field-label">Έτος:</span>
            <span class="field-value">${contract.carInfo.year}</span>
        </div>
        <div class="field">
            <span class="field-label">Χρώμα:</span>
            <span class="field-value">${contract.carInfo.color}</span>
        </div>
        <div class="field">
            <span class="field-label">Χιλιόμετρα:</span>
            <span class="field-value">${contract.carInfo.mileage}</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">ΠΕΡΙΟΔΟΣ ΕΝΟΙΚΙΑΣΗΣ</div>
        <div class="field">
            <span class="field-label">Ημερομηνία Παραλαβής:</span>
            <span class="field-value">${pickupDate}</span>
        </div>
        <div class="field">
            <span class="field-label">Ώρα Παραλαβής:</span>
            <span class="field-value">${contract.rentalPeriod.pickupTime}</span>
        </div>
        <div class="field">
            <span class="field-label">Ημερομηνία Επιστροφής:</span>
            <span class="field-value">${dropoffDate}</span>
        </div>
        <div class="field">
            <span class="field-label">Ώρα Επιστροφής:</span>
            <span class="field-value">${contract.rentalPeriod.dropoffTime}</span>
        </div>
        <div class="field">
            <span class="field-label">Τοποθεσία Παραλαβής:</span>
            <span class="field-value">${contract.rentalPeriod.pickupLocation}</span>
        </div>
        <div class="field">
            <span class="field-label">Τοποθεσία Επιστροφής:</span>
            <span class="field-value">${contract.rentalPeriod.dropoffLocation}</span>
        </div>
        <div class="field">
            <span class="field-label">Ποσό Εγγύησης:</span>
            <span class="field-value">€${contract.rentalPeriod.depositAmount}</span>
        </div>
        <div class="field">
            <span class="field-label">Κόστος Ασφάλειας:</span>
            <span class="field-value">€${contract.rentalPeriod.insuranceCost}</span>
        </div>
        <div class="field">
            <span class="field-label">Συνολικό Κόστος:</span>
            <span class="field-value">€${contract.rentalPeriod.totalCost}</span>
        </div>
    </div>

    ${options.includeDamageReports && contract.damagePoints && contract.damagePoints.length > 0 ? `
    <div class="section">
        <div class="section-title">ΚΑΤΑΓΡΑΦΗ ΖΗΜΙΩΝ</div>
        ${contract.damagePoints.map(damage => `
        <div class="field">
            <span class="field-label">Ζημιά:</span>
            <span class="field-value">${damage.description}</span>
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${options.includeSignatures ? `
    <div class="signature-section">
        <div class="section-title">ΥΠΟΓΡΑΦΕΣ</div>
        <div class="signature-box">Υπογραφή Ενοικιαστή</div>
        <div class="signature-box">Υπογραφή Υπαλλήλου</div>
    </div>
    ` : ''}

    <div class="footer">
        <p>Αυτό το έγγραφο δημιουργήθηκε ηλεκτρονικά από το σύστημα διαχείρισης συμβολαίων</p>
        <p>Ημερομηνία δημιουργίας: ${new Date().toLocaleString('el-GR')}</p>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate HTML content for multiple contracts
   */
  private static generateMultipleContractsHTML(contracts: Contract[], options: PDFExportOptions): string {
    const contractsHTML = contracts.map(contract => {
      const pickupDate = new Date(contract.rentalPeriod.pickupDate).toLocaleDateString('el-GR');
      const dropoffDate = new Date(contract.rentalPeriod.dropoffDate).toLocaleDateString('el-GR');
      
      return `
        <div style="page-break-after: always; margin-bottom: 30px;">
          <h2>Συμβόλαιο: ${contract.renterInfo.fullName}</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <strong>Ενοικιαστής:</strong> ${contract.renterInfo.fullName}<br>
              <strong>ΑΔΤ:</strong> ${contract.renterInfo.idNumber}<br>
              <strong>Τηλέφωνο:</strong> ${contract.renterInfo.phoneNumber}<br>
              <strong>Email:</strong> ${contract.renterInfo.email}
            </div>
            <div>
              <strong>Όχημα:</strong> ${contract.carInfo.makeModel}<br>
              <strong>Πινακίδα:</strong> ${contract.carInfo.licensePlate}<br>
              <strong>Παράλαβη:</strong> ${pickupDate}<br>
              <strong>Επιστροφή:</strong> ${dropoffDate}<br>
              <strong>Κόστος:</strong> €${contract.rentalPeriod.totalCost}
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="el">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Εξαγωγή Συμβολαίων</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007AFF;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        h2 {
            color: #007AFF;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ΕΞΑΓΩΓΗ ΣΥΜΒΟΛΑΙΩΝ</h1>
        <p>Συνολικά Συμβόλαια: ${contracts.length}</p>
        <p>Ημερομηνία Εξαγωγής: ${new Date().toLocaleDateString('el-GR')}</p>
    </div>

    ${contractsHTML}

    <div class="footer">
        <p>Αυτό το έγγραφο δημιουργήθηκε ηλεκτρονικά από το σύστημα διαχείρισης συμβολαίων</p>
        <p>Ημερομηνία δημιουργίας: ${new Date().toLocaleString('el-GR')}</p>
    </div>
</body>
</html>
    `;
  }
}
