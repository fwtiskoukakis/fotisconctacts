import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Contract, User } from '../models/contract.interface';
import { format } from 'date-fns';

/**
 * Service for generating PDF contracts
 */
export class PDFGenerationService {
  /**
   * Generate PDF contract with terms and conditions
   */
  static async generateContractPDF(contract: Contract, user: User): Promise<string> {
    try {
      const html = await this.generateContractHTML(contract, user);
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });
      
      return uri;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Share PDF file
   */
  static async sharePDF(uri: string): Promise<void> {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      throw error;
    }
  }

  /**
   * Generate HTML content for the contract
   */
  private static async generateContractHTML(contract: Contract, user: User): Promise<string> {
    const pickupDate = format(new Date(contract.rentalPeriod.pickupDate), 'dd/MM/yyyy');
    const dropoffDate = format(new Date(contract.rentalPeriod.dropoffDate), 'dd/MM/yyyy');
    const createdDate = format(new Date(contract.createdAt), 'dd/MM/yyyy HH:mm');

    // Get signature SVGs
    const clientSignatureSVG = contract.clientSignature ? await this.getSignatureSVG(contract.clientSignature) : '';
    const userSignatureSVG = user.signature ? await this.getSignatureSVG(user.signature) : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Συμβόλαιο Ενοικίασης</title>
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
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #007AFF;
            margin-bottom: 10px;
          }
          .subtitle {
            font-size: 16px;
            color: #666;
          }
          .section {
            margin-bottom: 25px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background-color: #f9f9f9;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #007AFF;
            margin-bottom: 15px;
            border-bottom: 1px solid #007AFF;
            padding-bottom: 5px;
          }
          .info-row {
            display: flex;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            width: 200px;
            color: #555;
          }
          .info-value {
            flex: 1;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #007AFF;
          }
          .signature-box {
            width: 45%;
            text-align: center;
          }
          .signature-line {
            border-bottom: 1px solid #333;
            height: 40px;
            margin-bottom: 10px;
          }
          .signature-image {
            height: 80px;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
          }
          .signature-image svg {
            width: 100%;
            height: 100%;
          }
          .terms {
            margin-top: 30px;
            padding: 20px;
            background-color: #f0f0f0;
            border-radius: 8px;
          }
          .terms-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #333;
          }
          .terms-content {
            font-size: 12px;
            line-height: 1.4;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">ΣΥΜΒΟΛΑΙΟ ΕΝΟΙΚΙΑΣΗΣ ΟΧΗΜΑΤΟΣ</div>
          <div class="subtitle">Ενοικιάσεις Πειραιάς</div>
        </div>

        <div class="section">
          <div class="section-title">Στοιχεία Ενοικιαστή</div>
          <div class="info-row">
            <div class="info-label">Ονοματεπώνυμο:</div>
            <div class="info-value">${contract.renterInfo.fullName}</div>
          </div>
          <div class="info-row">
            <div class="info-label">ΑΔΤ/Διαβατήριο:</div>
            <div class="info-value">${contract.renterInfo.idNumber}</div>
          </div>
          <div class="info-row">
            <div class="info-label">ΑΦΜ:</div>
            <div class="info-value">${contract.renterInfo.taxId || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Δίπλωμα Οδήγησης:</div>
            <div class="info-value">${contract.renterInfo.driverLicenseNumber || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Τηλέφωνο:</div>
            <div class="info-value">${contract.renterInfo.phoneNumber}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Email:</div>
            <div class="info-value">${contract.renterInfo.email || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Διεύθυνση:</div>
            <div class="info-value">${contract.renterInfo.address}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Στοιχεία Οχήματος</div>
          <div class="info-row">
            <div class="info-label">Μάρκα & Μοντέλο:</div>
            <div class="info-value">${contract.carInfo.makeModel || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Έτος:</div>
            <div class="info-value">${contract.carInfo.year}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Πινακίδα:</div>
            <div class="info-value">${contract.carInfo.licensePlate}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Καύσιμο:</div>
            <div class="info-value">${contract.carCondition?.fuelLevel || 'N/A'}/8</div>
          </div>
          <div class="info-row">
            <div class="info-label">Χιλιόμετρα:</div>
            <div class="info-value">${contract.carCondition?.mileage || contract.carInfo.mileage || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Ασφάλεια:</div>
            <div class="info-value">${contract.carCondition?.insuranceType === 'basic' ? 'Βασική' : contract.carCondition?.insuranceType === 'full' ? 'Πλήρης' : 'N/A'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Περίοδος Ενοικίασης</div>
          <div class="info-row">
            <div class="info-label">Ημερομηνία Παραλαβής:</div>
            <div class="info-value">${pickupDate} ${contract.rentalPeriod.pickupTime}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Τοποθεσία Παραλαβής:</div>
            <div class="info-value">${contract.rentalPeriod.pickupLocation}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Ημερομηνία Επιστροφής:</div>
            <div class="info-value">${dropoffDate} ${contract.rentalPeriod.dropoffTime}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Τοποθεσία Επιστροφής:</div>
            <div class="info-value">${contract.rentalPeriod.dropoffLocation}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Συνολικό Κόστος:</div>
            <div class="info-value">€${contract.rentalPeriod.totalCost || 0}</div>
          </div>
        </div>

        ${contract.damagePoints.length > 0 ? `
        <div class="section">
          <div class="section-title">Καταγεγραμμένες Ζημιές</div>
          ${contract.damagePoints.map((damage, index) => `
            <div class="info-row">
              <div class="info-label">Ζημιά ${index + 1}:</div>
              <div class="info-value">${damage.view} - Θέση: (${damage.x.toFixed(1)}%, ${damage.y.toFixed(1)}%) - Σοβαρότητα: ${damage.severity}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="signatures">
          <div class="signature-box">
            ${contract.clientSignature ? `
              <div class="signature-image">
                ${clientSignatureSVG}
              </div>
            ` : `
              <div class="signature-line"></div>
            `}
            <div><strong>Υπογραφή Ενοικιαστή</strong></div>
            <div>${contract.renterInfo.fullName}</div>
          </div>
          <div class="signature-box">
            ${user.signature ? `
              <div class="signature-image">
                ${userSignatureSVG}
              </div>
            ` : `
              <div class="signature-line"></div>
            `}
            <div><strong>Υπογραφή Διαχειριστή</strong></div>
            <div>${user.name}</div>
          </div>
        </div>

        <div class="terms">
          <div class="terms-title">Όροι και Προϋποθέσεις</div>
          <div class="terms-content">
            <p><strong>1. Ευθύνη Ενοικιαστή:</strong> Ο ενοικιαστής είναι υπεύθυνος για την ασφαλή χρήση του οχήματος και την τήρηση όλων των κανόνων κυκλοφορίας.</p>
            <p><strong>2. Ασφάλεια:</strong> Το όχημα είναι ασφαλισμένο με ${contract.carCondition?.insuranceType === 'basic' ? 'βασική' : 'πλήρη'} κάλυψη.</p>
            <p><strong>3. Ζημιές:</strong> Οι ζημιές που καταγράφηκαν κατά την παραλαβή είναι ${contract.damagePoints.length} σε αριθμό.</p>
            <p><strong>4. Επιστροφή:</strong> Το όχημα πρέπει να επιστραφεί στην καθορισμένη ημερομηνία και ώρα.</p>
            <p><strong>5. Καύσιμα:</strong> Το όχημα παραδίδεται με ${contract.carCondition?.fuelLevel || 8}/8 καύσιμα και πρέπει να επιστραφεί με την ίδια ποσότητα.</p>
            <p><strong>6. Παράβαση:</strong> Η παραβίαση των όρων του συμβολαίου μπορεί να οδηγήσει σε πρόσθετες χρεώσεις.</p>
          </div>
        </div>

        <div class="footer">
          <p>Το συμβόλαιο δημιουργήθηκε στις ${createdDate}</p>
          <p>Ενοικιάσεις Πειραιάς - Συμβόλαιο ID: ${contract.id}</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get signature SVG content for PDF
   */
  private static async getSignatureSVG(signatureUri: string): Promise<string> {
    try {
      const svgContent = await FileSystem.readAsStringAsync(signatureUri);
      return svgContent;
    } catch (error) {
      console.error('Error reading signature file:', error);
      return '';
    }
  }
}
