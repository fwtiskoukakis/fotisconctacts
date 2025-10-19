import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { Contract, User } from '../models/contract.interface';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import { supabase } from '../utils/supabase';

/**
 * Professional PDF Contract Generation Service
 * Features: Beautiful design, QR codes, damage photos, bilingual, AADE integration
 */
export class PDFContractProService {
  
  // Logo and vehicle diagrams will be referenced from assets
  private static readonly LOGO_PATH = require('../assets/logo.png');
  private static readonly CAR_DIAGRAM = require('../assets/car_conditions.png');
  private static readonly ATV_DIAGRAM = require('../assets/atv-conditions.png');
  private static readonly SCOOTER_DIAGRAM = require('../assets/scooter-conditions.png');
  
  /**
   * Generate professional PDF contract
   */
  static async generateProfessionalContract(
    contract: Contract,
    user: User,
    options: {
      language?: 'el' | 'en';
      includePhotos?: boolean;
      includeDamages?: boolean;
      includeQRCode?: boolean;
    } = {}
  ): Promise<string> {
    try {
      const {
        language = 'el',
        includePhotos = true,
        includeDamages = true,
        includeQRCode = true,
      } = options;

      // Generate QR code if enabled
      let qrCodeDataURL = '';
      if (includeQRCode) {
        qrCodeDataURL = await this.generateQRCode(contract.id);
      }

      // Get damage photos
      let damagePhotosHTML = '';
      if (includePhotos && contract.photoUris.length > 0) {
        damagePhotosHTML = await this.generateDamagePhotosHTML(contract.photoUris);
      }

      // Generate HTML
      const html = language === 'el' 
        ? await this.generateGreekContractHTML(contract, user, qrCodeDataURL, damagePhotosHTML)
        : await this.generateEnglishContractHTML(contract, user, qrCodeDataURL, damagePhotosHTML);

      console.log('✅ PDF HTML generated, length:', html.length);
      console.log('📄 Contract ID:', contract.id.substring(0, 8));
      console.log('👤 User:', user.name);

      // Special handling for web platform
      if (Platform.OS === 'web') {
        // On web, open HTML in new window and trigger print
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          
          // Wait for content to load then print
          printWindow.onload = () => {
            printWindow.print();
          };
          
          // Return a placeholder URI for web
          return 'web-print-initiated';
        }
      }

      // Generate PDF with better options for A4 size (for mobile)
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 595, // A4 width in points (8.27 inches)
        height: 842, // A4 height in points (11.69 inches)
        margins: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
      });

      console.log('✅ PDF generated successfully:', uri);

      // Upload to Supabase Storage (optional)
      // await this.uploadToSupabase(uri, contract.id);

      return uri;
    } catch (error) {
      console.error('Error generating professional PDF:', error);
      throw error;
    }
  }

  /**
   * Generate Greek Contract HTML
   */
  private static async generateGreekContractHTML(
    contract: Contract,
    user: User,
    qrCode: string,
    damagePhotosHTML: string
  ): Promise<string> {
    const pickupDate = format(new Date(contract.rentalPeriod.pickupDate), 'dd/MM/yyyy', { locale: el });
    const dropoffDate = format(new Date(contract.rentalPeriod.dropoffDate), 'dd/MM/yyyy', { locale: el });
    const createdDate = format(new Date(contract.createdAt), 'dd/MM/yyyy HH:mm', { locale: el });
    
    // Calculate rental days
    const days = Math.ceil(
      (new Date(contract.rentalPeriod.dropoffDate).getTime() - 
       new Date(contract.rentalPeriod.pickupDate).getTime()) / 
      (1000 * 60 * 60 * 24)
    );

    // AADE Status Badge (simplified - no gradient)
    const aadeBadge = contract.aadeStatus === 'submitted' || contract.aadeStatus === 'completed'
      ? `<div class="aade-badge">
           <span class="aade-icon">✓</span>
           <span>Ανεβασμένο στο ΑΑΔΕ</span>
           ${contract.aadeDclId ? `<span class="aade-id">DCL: ${contract.aadeDclId}</span>` : ''}
         </div>`
      : '';
    
    // Get vehicle diagram based on type
    const vehicleDiagram = this.getVehicleDiagram(contract.carInfo.category || 'car');

    return `
<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Συμβόλαιο #${contract.id.substring(0, 8).toUpperCase()}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 11px;
      color: #1a1a1a;
      line-height: 1.5;
      background: #fff;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm;
      margin: 0 auto;
      background: white;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 15px;
      border-bottom: 2px solid #333;
      margin-bottom: 20px;
    }
    
    .company-info {
      flex: 1;
    }
    
    .company-logo-text {
      font-size: 28px;
      font-weight: 900;
      margin-bottom: 5px;
      letter-spacing: -1px;
      line-height: 1;
    }
    
    .company-tagline {
      font-size: 10px;
      color: #666;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .company-details {
      font-size: 9px;
      line-height: 1.6;
      color: #444;
    }
    
    .company-details strong {
      font-weight: 600;
    }
    
    .contract-header {
      text-align: right;
    }
    
    .contract-number {
      font-size: 16px;
      font-weight: 700;
      color: #007AFF;
      margin-bottom: 5px;
    }
    
    .contract-date {
      font-size: 9px;
      color: #666;
      margin-bottom: 8px;
    }
    
    .qr-code {
      width: 60px;
      height: 60px;
      margin-top: 8px;
    }
    
    .qr-code img {
      width: 100%;
      height: 100%;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }
    
    /* AADE Badge - Simple, no gradient */
    .aade-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #28a745;
      color: white;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 600;
      margin-top: 8px;
    }
    
    .aade-icon {
      width: 14px;
      height: 14px;
      background: white;
      color: #28a745;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
    }
    
    .aade-id {
      font-size: 8px;
      opacity: 0.9;
    }
    
    /* Section Styles */
    .section {
      margin-bottom: 18px;
      break-inside: avoid;
    }
    
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #007AFF;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 2px solid #007AFF;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .section-icon {
      width: 20px;
      height: 20px;
      background: #007AFF;
      color: white;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }
    
    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      background: #f8f9fa;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    
    .info-label {
      font-size: 8px;
      color: #6c757d;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .info-value {
      font-size: 10px;
      color: #212529;
      font-weight: 600;
    }
    
    /* Rental Summary Box - Simple, no gradient */
    .rental-summary {
      background: #f8f9fa;
      border: 2px solid #333;
      color: #333;
      padding: 15px;
      border-radius: 8px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .summary-item {
      text-align: center;
    }
    
    .summary-label {
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.9;
      margin-bottom: 5px;
    }
    
    .summary-value {
      font-size: 18px;
      font-weight: 700;
    }
    
    /* Vehicle Card */
    .vehicle-card {
      background: #fff;
      border: 2px solid #007AFF;
      border-radius: 10px;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .vehicle-main {
      flex: 1;
    }
    
    .vehicle-name {
      font-size: 16px;
      font-weight: 700;
      color: #007AFF;
      margin-bottom: 5px;
    }
    
    .vehicle-plate {
      display: inline-block;
      background: #007AFF;
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    
    .vehicle-details {
      display: flex;
      gap: 15px;
      margin-top: 10px;
      font-size: 9px;
    }
    
    .vehicle-detail {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .vehicle-detail-label {
      color: #6c757d;
      font-weight: 600;
    }
    
    .vehicle-detail-value {
      color: #212529;
      font-weight: 700;
    }
    
    /* Fuel Gauge */
    .fuel-gauge {
      display: flex;
      gap: 2px;
    }
    
    .fuel-bar {
      width: 8px;
      height: 20px;
      background: #e9ecef;
      border-radius: 2px;
    }
    
    .fuel-bar.filled {
      background: #28a745;
    }
    
    /* Damages List */
    .damages-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    
    .damage-item {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 6px;
      padding: 8px;
      font-size: 9px;
    }
    
    .damage-severity {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 8px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .damage-severity.minor {
      background: #d1ecf1;
      color: #0c5460;
    }
    
    .damage-severity.moderate {
      background: #fff3cd;
      color: #856404;
    }
    
    .damage-severity.severe {
      background: #f8d7da;
      color: #721c24;
    }
    
    /* Vehicle Condition Diagram */
    .condition-diagram {
      margin-top: 15px;
      padding: 15px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      text-align: center;
    }
    
    .condition-diagram img {
      max-width: 100%;
      height: auto;
      max-height: 300px;
      margin: 10px auto;
      display: block;
    }
    
    .condition-notes {
      margin-top: 10px;
      padding: 12px;
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      text-align: left;
      font-size: 10px;
      line-height: 1.6;
    }
    
    /* Photos Grid */
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 12px;
    }
    
    .photo-item {
      border: 1px solid #dee2e6;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .photo-item img {
      width: 100%;
      height: auto;
      display: block;
    }
    
    /* Signatures */
    .signatures {
      display: flex;
      justify-content: space-between;
      gap: 30px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e9ecef;
    }
    
    .signature-box {
      flex: 1;
      text-align: center;
    }
    
    .signature-image {
      width: 100%;
      height: 80px;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
    }
    
    .signature-image img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    
    .signature-line {
      width: 100%;
      height: 80px;
      border: 1px dashed #adb5bd;
      border-radius: 6px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #adb5bd;
      font-size: 9px;
    }
    
    .signature-name {
      font-weight: 600;
      color: #212529;
      margin-bottom: 3px;
    }
    
    .signature-role {
      font-size: 9px;
      color: #6c757d;
    }
    
    /* Terms Page */
    .terms-page {
      page-break-before: always;
    }
    
    .terms-title {
      font-size: 16px;
      font-weight: 700;
      color: #007AFF;
      margin-bottom: 15px;
      text-align: center;
    }
    
    .terms-content {
      font-size: 10px;
      line-height: 1.6;
    }
    
    .term-item {
      margin-bottom: 15px;
      padding: 12px;
      background: #f8f9fa;
      border-left: 3px solid #007AFF;
      border-radius: 4px;
    }
    
    .term-title {
      font-weight: 700;
      color: #007AFF;
      margin-bottom: 6px;
    }
    
    /* Footer */
    .footer {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 2px solid #e9ecef;
      text-align: center;
      font-size: 8px;
      color: #6c757d;
    }
    
    .footer-links {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-top: 8px;
    }
    
    .footer-link {
      color: #007AFF;
      text-decoration: none;
    }
    
    /* Print Styles */
    @media print {
      .page {
        margin: 0;
        border: none;
        box-shadow: none;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <!-- PAGE 1: Contract Details -->
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <div class="company-logo-text">
          <span style="color: #FFD700;">AGGELOS</span> <span style="color: #007AFF;">RENTALS</span>
        </div>
        <div class="company-tagline">Rental Cars & Motorbikes</div>
        <div class="company-details">
          <strong>VAT:</strong> 050691970 &nbsp;|&nbsp; <strong>MHTE:</strong> 1175E81000043400<br/>
          <strong>Διεύθυνση:</strong> Antiparos Port, Cyclades 84007, Greece<br/>
          <strong>Τηλ:</strong> +30 6944950094 | +30 6980151068 | +30 6947150846<br/>
          <strong>Email:</strong> aggelos@antiparosrentacar.com<br/>
          <strong>Web:</strong> www.antiparosrentacar.com
        </div>
      </div>
      
      <div class="contract-header">
        <div class="contract-number">ΣΥΜΒΟΛΑΙΟ #${contract.id.substring(0, 8).toUpperCase()}</div>
        <div class="contract-date">Ημερομηνία: ${createdDate}</div>
        ${qrCode ? `<div class="qr-code"><img src="${qrCode}" alt="QR Code"/></div>` : ''}
        ${aadeBadge}
      </div>
    </div>
    
    <!-- Rental Summary -->
    <div class="rental-summary">
      <div class="summary-item">
        <div class="summary-label">Διάρκεια</div>
        <div class="summary-value">${days} ${days === 1 ? 'Ημέρα' : 'Ημέρες'}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Συνολικό Κόστος</div>
        <div class="summary-value">€${contract.rentalPeriod.totalCost?.toFixed(2) || '0.00'}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Ασφάλιση</div>
        <div class="summary-value">${contract.carCondition?.insuranceType === 'full' ? 'Πλήρης' : 'Βασική'}</div>
      </div>
    </div>
    
    <!-- Vehicle Information -->
    <div class="section">
      <div class="section-title">
        <span class="section-icon">🚗</span>
        ΣΤΟΙΧΕΙΑ ΟΧΗΜΑΤΟΣ
      </div>
      <div class="vehicle-card">
        <div class="vehicle-main">
          <div class="vehicle-name">${contract.carInfo.makeModel}</div>
          <div class="vehicle-plate">${contract.carInfo.licensePlate}</div>
          <div class="vehicle-details">
            <div class="vehicle-detail">
              <span class="vehicle-detail-label">Έτος</span>
              <span class="vehicle-detail-value">${contract.carInfo.year}</span>
            </div>
            <div class="vehicle-detail">
              <span class="vehicle-detail-label">Χιλιόμετρα</span>
              <span class="vehicle-detail-value">${contract.carCondition?.mileage?.toLocaleString() || contract.carInfo.mileage?.toLocaleString() || 'N/A'} km</span>
            </div>
            <div class="vehicle-detail">
              <span class="vehicle-detail-label">Καύσιμο</span>
              <div class="fuel-gauge">
                ${Array.from({ length: 8 }).map((_, i) => 
                  `<div class="fuel-bar ${i < (contract.carCondition?.fuelLevel || 8) ? 'filled' : ''}"></div>`
                ).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Renter Information -->
    <div class="section">
      <div class="section-title">
        <span class="section-icon">👤</span>
        ΣΤΟΙΧΕΙΑ ΕΝΟΙΚΙΑΣΤΗ
      </div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Ονοματεπώνυμο</span>
          <span class="info-value">${contract.renterInfo.fullName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">ΑΔΤ/Διαβατήριο</span>
          <span class="info-value">${contract.renterInfo.idNumber}</span>
        </div>
        <div class="info-item">
          <span class="info-label">ΑΦΜ</span>
          <span class="info-value">${contract.renterInfo.taxId || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Δίπλωμα</span>
          <span class="info-value">${contract.renterInfo.driverLicenseNumber || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Τηλέφωνο</span>
          <span class="info-value">${contract.renterInfo.phoneNumber}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Email</span>
          <span class="info-value">${contract.renterInfo.email || 'N/A'}</span>
        </div>
        <div class="info-item" style="grid-column: 1 / -1;">
          <span class="info-label">Διεύθυνση</span>
          <span class="info-value">${contract.renterInfo.address}</span>
        </div>
      </div>
    </div>
    
    <!-- Rental Period -->
    <div class="section">
      <div class="section-title">
        <span class="section-icon">📅</span>
        ΠΕΡΙΟΔΟΣ ΕΝΟΙΚΙΑΣΗΣ
      </div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Παραλαβή</span>
          <span class="info-value">${pickupDate} | ${contract.rentalPeriod.pickupTime}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Επιστροφή</span>
          <span class="info-value">${dropoffDate} | ${contract.rentalPeriod.dropoffTime}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Τοποθεσία Παραλαβής</span>
          <span class="info-value">${contract.rentalPeriod.pickupLocation}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Τοποθεσία Επιστροφής</span>
          <span class="info-value">${contract.rentalPeriod.dropoffLocation}</span>
        </div>
      </div>
    </div>
    
    <!-- Vehicle Condition -->
    <div class="section">
      <div class="section-title">
        <span class="section-icon">📋</span>
        ΚΑΤΑΣΤΑΣΗ ΟΧΗΜΑΤΟΣ
      </div>
      <div class="condition-diagram">
        <div style="padding: 20px; background: white; border: 2px solid #333; border-radius: 8px; text-align: center;">
          <strong style="font-size: 14px;">Τύπος Οχήματος: ${this.getVehicleTypeLabel(contract.carInfo.category || 'car')}</strong>
          <div style="margin-top: 10px; font-size: 12px; color: #666;">
            Καύσιμο: ${contract.carCondition?.fuelLevel || 8}/8 • 
            Χιλιόμετρα: ${contract.carCondition?.mileage?.toLocaleString() || contract.carInfo.mileage?.toLocaleString()} km
          </div>
        </div>
        ${contract.carCondition?.notes ? `
          <div class="condition-notes">
            <strong>Σημειώσεις Κατάστασης:</strong><br/>
            ${contract.carCondition.notes}
          </div>
        ` : ''}
      </div>
    </div>
    
    <!-- Damages -->
    ${contract.damagePoints.length > 0 ? `
    <div class="section">
      <div class="section-title">
        <span class="section-icon">⚠️</span>
        ΚΑΤΑΓΕΓΡΑΜΜΕΝΕΣ ΖΗΜΙΕΣ (${contract.damagePoints.length})
      </div>
      <div class="damages-list">
        ${contract.damagePoints.map((damage, index) => `
          <div class="damage-item">
            <span class="damage-severity ${damage.severity}">${
              damage.severity === 'minor' ? 'Μικρή' : 
              damage.severity === 'moderate' ? 'Μέτρια' : 
              'Σοβαρή'
            }</span>
            <div><strong>Ζημιά ${index + 1}:</strong> ${
              damage.view === 'front' ? 'Μπροστά' :
              damage.view === 'rear' ? 'Πίσω' :
              damage.view === 'left' ? 'Αριστερά' :
              'Δεξιά'
            }</div>
            <div>${damage.description}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
    
    <!-- Photos -->
    ${damagePhotosHTML}
    
    <!-- Signatures -->
    <div class="signatures">
      <div class="signature-box">
        ${contract.clientSignature ? `
          <div class="signature-image">
            <img src="${contract.clientSignature}" alt="Client Signature"/>
          </div>
        ` : `
          <div class="signature-line">Υπογραφή Ενοικιαστή</div>
        `}
        <div class="signature-name">${contract.renterInfo.fullName}</div>
        <div class="signature-role">Ενοικιαστής</div>
      </div>
      
      <div class="signature-box">
        ${user.signature || user.signatureUrl ? `
          <div class="signature-image">
            <img src="${user.signatureUrl || user.signature}" alt="Agent Signature"/>
          </div>
        ` : `
          <div class="signature-line">Υπογραφή Διαχειριστή</div>
        `}
        <div class="signature-name">${user.name}</div>
        <div class="signature-role">Διαχειριστής / Agent</div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div>© ${new Date().getFullYear()} AGGELOS RENTALS - Όλα τα δικαιώματα διατηρούνται</div>
      <div class="footer-links">
        <a href="tel:+306944950094" class="footer-link">📞 Επικοινωνία</a>
        <span>|</span>
        <a href="https://www.antiparosrentacar.com" class="footer-link">🌐 Website</a>
        <span>|</span>
        <span>ID: ${contract.id.substring(0, 13)}</span>
      </div>
    </div>
  </div>
  
  <!-- PAGE 2: Terms & Conditions -->
  <div class="page terms-page">
    <div class="terms-title">ΟΡΟΙ ΚΑΙ ΠΡΟΫΠΟΘΕΣΕΙΣ ΕΝΟΙΚΙΑΣΗΣ</div>
    
    <div class="terms-content">
      <div class="term-item">
        <div class="term-title">1. ΓΕΝΙΚΟΙ ΟΡΟΙ</div>
        <p>Η ενοικίαση του οχήματος διέπεται από τους παρόντες όρους και την ισχύουσα ελληνική νομοθεσία. Η τιμή υπολογίζεται σε ημερήσια βάση (24ωρη περίοδος) και περιλαμβάνει βασική ασφάλιση κατά των κλοπών και ζημιών.</p>
      </div>
      
      <div class="term-item">
        <div class="term-title">2. ΠΡΟΫΠΟΘΕΣΕΙΣ ΟΔΗΓΟΥ</div>
        <p>Ο οδηγός πρέπει να κατέχει έγκυρο δίπλωμα οδήγησης για τουλάχιστον 2 έτη και να είναι ηλικίας τουλάχιστον 21 ετών. Για ορισμένες κατηγορίες οχημάτων μπορεί να απαιτείται ηλικία 23 ή 25 ετών.</p>
      </div>
      
      <div class="term-item">
        <div class="term-title">3. ΑΣΦΑΛΙΣΤΙΚΗ ΚΑΛΥΨΗ</div>
        <p>Το όχημα διαθέτει ${contract.carCondition?.insuranceType === 'full' ? 'πλήρη' : 'βασική'} ασφαλιστική κάλυψη σύμφωνα με την ελληνική νομοθεσία. Η κάλυψη CDW (Collision Damage Waiver) και TP (Theft Protection) εφαρμόζεται με τους όρους που αναφέρονται στο συμβόλαιο. Οποιαδήποτε ζημιά από αμέλεια, οδήγηση υπό την επήρεια αλκοόλ ή ουσιών, ή παραβίαση των όρων ακυρώνει την ασφαλιστική προστασία.</p>
      </div>
      
      <div class="term-item">
        <div class="term-title">4. ΚΑΥΣΙΜΑ & ΧΙΛΙΟΜΕΤΡΑ</div>
        <p>Το όχημα παραδίδεται με ${contract.carCondition?.fuelLevel || 8}/8 καύσιμο και πρέπει να επιστραφεί με την ίδια ποσότητα. Τα χιλιόμετρα κατά την παράδοση είναι ${contract.carCondition?.mileage?.toLocaleString() || contract.carInfo.mileage?.toLocaleString()} km. Υπερβάσεις χρεώνονται επιπλέον.</p>
      </div>
      
      <div class="term-item">
        <div class="term-title">5. ΠΕΡΙΟΡΙΣΜΟΙ ΧΡΗΣΗΣ</div>
        <p>Τα οχήματα πρέπει να παραμένουν εντός της Ελληνικής Επικράτειας εκτός εάν υπάρχει προηγούμενη έγγραφη άδεια. Απαγορεύεται το κάπνισμα στο εσωτερικό του οχήματος. Οποιαδήποτε παραβίαση, ατύχημα ή αμέλεια ακυρώνει την προστασία CDW.</p>
      </div>
      
      <div class="term-item">
        <div class="term-title">6. ΚΑΤΑΓΕΓΡΑΜΜΕΝΕΣ ΖΗΜΙΕΣ</div>
        <p>Κατά την παραλαβή του οχήματος έχουν καταγραφεί ${contract.damagePoints.length} ${contract.damagePoints.length === 1 ? 'ζημιά' : 'ζημιές'}. Ο ενοικιαστής είναι υπεύθυνος για οποιαδήποτε νέα ζημιά προκληθεί κατά τη διάρκεια της ενοικίασης. Τυχόν νέες ζημιές πρέπει να αναφερθούν άμεσα.</p>
      </div>
      
      <div class="term-item">
        <div class="term-title">7. ΕΠΙΣΤΡΟΦΗ ΟΧΗΜΑΤΟΣ</div>
        <p>Το όχημα πρέπει να επιστραφεί στην καθορισμένη ημερομηνία και ώρα (${dropoffDate} ${contract.rentalPeriod.dropoffTime}) στην τοποθεσία ${contract.rentalPeriod.dropoffLocation}. Καθυστερημένη επιστροφή χρεώνεται επιπλέον. Σε περίπτωση μη επιστροφής, το όχημα θεωρείται κλεμμένο και θα ενημερωθούν οι αρχές.</p>
      </div>
      
      <div class="term-item">
        <div class="term-title">8. ΕΥΘΥΝΗ ΕΝΟΙΚΙΑΣΤΗ</div>
        <p>Ο ενοικιαστής είναι πλήρως υπεύθυνος για την τήρηση των κανόνων οδικής κυκλοφορίας, τυχόν πρόστιμα, παραβιάσεις και αποζημιώσεις τρίτων. Οφείλει να διατηρεί το όχημα σε καλή κατάσταση και να αναφέρει άμεσα οποιοδήποτε πρόβλημα.</p>
      </div>
      
      <div class="term-item">
        <div class="term-title">9. ΑΚΥΡΩΣΕΙΣ & ΤΡΟΠΟΠΟΙΗΣΕΙΣ</div>
        <p>Ακυρώσεις πρέπει να γίνονται τουλάχιστον 24 ώρες πριν την ημερομηνία παραλαβής για πλήρη επιστροφή χρημάτων. Τροποποιήσεις υπόκεινται σε διαθεσιμότητα και ενδέχεται να επιβαρύνονται με πρόσθετο κόστος.</p>
      </div>
      
      <div class="term-item">
        <div class="term-title">10. ΠΡΟΣΤΑΣΙΑ ΠΡΟΣΩΠΙΚΩΝ ΔΕΔΟΜΕΝΩΝ</div>
        <p>Τα προσωπικά δεδομένα που συλλέγονται χρησιμοποιούνται αποκλειστικά για τους σκοπούς της ενοικίασης και προστατεύονται σύμφωνα με τον GDPR και την ελληνική νομοθεσία. Δεν διαβιβάζονται σε τρίτους χωρίς τη συγκατάθεση του ενοικιαστή.</p>
      </div>
      
      <div class="term-item">
        <div class="term-title">11. ΨΗΦΙΑΚΟ ΠΕΛΑΤΟΛΟΓΙΟ (myDATA)</div>
        ${contract.aadeStatus ? `
          <p>Το παρόν συμβόλαιο έχει καταχωρηθεί στο Ψηφιακό Πελατολόγιο της ΑΑΔΕ (myDATA) ${contract.aadeDclId ? `με αριθμό DCL: ${contract.aadeDclId}` : ''}. Η καταχώρηση πραγματοποιήθηκε σύμφωνα με τις διατάξεις της ελληνικής φορολογικής νομοθεσίας.</p>
        ` : `
          <p>Το παρόν συμβόλαιο υπόκειται σε καταχώρηση στο Ψηφιακό Πελατολόγιο της ΑΑΔΕ (myDATA) σύμφωνα με τις διατάξεις της ελληνικής φορολογικής νομοθεσίας.</p>
        `}
      </div>
    </div>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #007AFF;">
      <p style="text-align: center; font-size: 11px; font-weight: 600; margin-bottom: 15px;">
        ΔΗΛΩΣΗ ΑΠΟΔΟΧΗΣ ΟΡΩΝ
      </p>
      <p style="font-size: 10px; line-height: 1.6; margin-bottom: 20px;">
        Με την υπογραφή μου επιβεβαιώνω ότι έχω διαβάσει, κατανοήσει και αποδέχομαι όλους τους παραπάνω όρους και προϋποθέσεις.
        Έχω παραλάβει το όχημα σε καλή κατάσταση με τις ζημιές που αναφέρονται και αναλαμβάνω την πλήρη ευθύνη για την ασφαλή
        χρήση του και την επιστροφή του στην ίδια κατάσταση.
      </p>
      
      <div class="signatures">
        <div class="signature-box">
          <div class="signature-line">Υπογραφή Ενοικιαστή</div>
          <div class="signature-name">${contract.renterInfo.fullName}</div>
          <div class="signature-role">Ημερομηνία: ${pickupDate}</div>
        </div>
        
        <div class="signature-box">
          <div class="signature-line">Υπογραφή Διαχειριστή</div>
          <div class="signature-name">${user.name}</div>
          <div class="signature-role">Ημερομηνία: ${createdDate}</div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <div><strong>AGGELOS RENTALS</strong> - Antiparos Port, Cyclades 84007, Greece</div>
      <div class="footer-links">
        <span>📞 +30 6944950094</span>
        <span>|</span>
        <span>✉️ aggelos@antiparosrentacar.com</span>
        <span>|</span>
        <span>🌐 www.antiparosrentacar.com</span>
      </div>
      <div style="margin-top: 8px;">Πλήρεισ όροι διαθέσιμοι στο website ή στο γραφείο μας</div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate English Contract HTML (similar structure, translated)
   */
  private static async generateEnglishContractHTML(
    contract: Contract,
    user: User,
    qrCode: string,
    damagePhotosHTML: string
  ): Promise<string> {
    // Similar to Greek but with English text
    // Implementation would be similar with translated strings
    return this.generateGreekContractHTML(contract, user, qrCode, damagePhotosHTML);
  }

  /**
   * Generate QR Code for contract verification
   */
  private static async generateQRCode(contractId: string): Promise<string> {
    try {
      // Using a QR code generation API (you can use expo-qr-code or an API)
      const qrAPI = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://antiparosrentacar.com/verify/${contractId}`)}`;
      return qrAPI;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  }

  /**
   * Get vehicle type label in Greek
   */
  private static getVehicleTypeLabel(category: string): string {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('atv') || categoryLower.includes('quad')) {
      return 'ATV / Γουρούνα';
    } else if (categoryLower.includes('scooter')) {
      return 'Scooter / Μηχανάκι';
    } else if (categoryLower.includes('moto') || categoryLower.includes('bike')) {
      return 'Μοτοσικλέτα';
    } else {
      return 'Αυτοκίνητο';
    }
  }
  
  /**
   * Get vehicle diagram based on vehicle type/category
   */
  private static getVehicleDiagram(category: string): string {
    // This method is kept for backwards compatibility but diagrams are now text-based
    return '';
  }

  /**
   * Generate damage photos HTML
   */
  private static async generateDamagePhotosHTML(photoUris: string[]): Promise<string> {
    if (photoUris.length === 0) return '';

    const photosHTML = photoUris.slice(0, 6).map(uri => `
      <div class="photo-item">
        <img src="${uri}" alt="Vehicle Photo"/>
      </div>
    `).join('');

    return `
      <div class="section">
        <div class="section-title">
          <span class="section-icon">📷</span>
          ΦΩΤΟΓΡΑΦΙΕΣ ΖΗΜΙΩΝ (${photoUris.length})
        </div>
        <div class="photos-grid">
          ${photosHTML}
        </div>
      </div>
    `;
  }

  /**
   * Share generated PDF
   */
  static async sharePDF(uri: string, contractId: string): Promise<void> {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Συμβόλαιο #${contractId.substring(0, 8).toUpperCase()}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      throw error;
    }
  }

  /**
   * Upload PDF to Supabase Storage (optional)
   */
  private static async uploadToSupabase(pdfUri: string, contractId: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(pdfUri, {
        encoding: 'base64',
      });

      const fileName = `contract_${contractId}_${Date.now()}.pdf`;
      const { data, error } = await supabase.storage
        .from('contracts')
        .upload(fileName, decode(base64), {
          contentType: 'application/pdf',
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('contracts')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading to Supabase:', error);
      throw error;
    }
  }
}

// Helper function to decode base64
function decode(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

