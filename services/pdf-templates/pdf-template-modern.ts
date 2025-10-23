import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Contract, User } from '../../models/contract.interface';
import { format } from 'date-fns';
import { RENTAL_TERMS } from './rental-terms';

export class PDFTemplateModern {
  /**
   * Generate Modern Clean Template PDF
   * Sleek contemporary design with accent colors
   */
  static async generatePDF(
    contract: Contract,
    user: User,
    options: {
      language?: 'el' | 'en';
      includePhotos?: boolean;
      includeDamages?: boolean;
      includeQRCode?: boolean;
    } = {}
  ): Promise<string> {
    const html = this.generateHTML(contract, user, options);

    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }
      return 'web-print-initiated';
    }

    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  }

  private static generateHTML(
    contract: Contract,
    user: User,
    options: any
  ): string {
    const contractNumber = contract.id.slice(0, 8).toUpperCase();
    const pickupDate = contract.rentalPeriod?.pickupDate 
      ? format(new Date(contract.rentalPeriod.pickupDate), 'dd/MM/yyyy')
      : 'N/A';
    const dropoffDate = contract.rentalPeriod?.dropoffDate
      ? format(new Date(contract.rentalPeriod.dropoffDate), 'dd/MM/yyyy')
      : 'N/A';
    
    // Calculate rental duration
    const pickup = contract.rentalPeriod?.pickupDate ? new Date(contract.rentalPeriod.pickupDate) : null;
    const dropoff = contract.rentalPeriod?.dropoffDate ? new Date(contract.rentalPeriod.dropoffDate) : null;
    const duration = pickup && dropoff ? Math.ceil((dropoff.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // Generate fuel gauge visual
    const fuelLevel = contract.carCondition?.fuelLevel || 0;
    const fuelBars = '█'.repeat(fuelLevel) + '░'.repeat(8 - fuelLevel);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Contract #${contractNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: #f5f7fa;
      padding: 25px;
    }
    
    /* HEADER */
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px 30px;
      border-radius: 15px 15px 0 0;
      margin-bottom: 0;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .company-name {
      font-size: 24pt;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .contract-badge {
      background: rgba(255,255,255,0.2);
      padding: 10px 20px;
      border-radius: 25px;
      backdrop-filter: blur(10px);
      text-align: center;
    }
    .contract-label {
      font-size: 8pt;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .contract-number {
      font-size: 14pt;
      font-weight: bold;
    }
    .header-bottom {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      font-size: 9pt;
    }
    .company-detail {
      opacity: 0.95;
    }
    .aade-badge-modern {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 8pt;
      font-weight: 600;
      margin-top: 10px;
    }

    /* SUMMARY CARDS */
    .summary-cards {
      background: white;
      padding: 0;
      border-radius: 0 0 15px 15px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      margin-bottom: 25px;
      overflow: hidden;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
    }
    .summary-card {
      padding: 25px;
      text-align: center;
      border-right: 1px solid #e5e7eb;
      transition: all 0.3s;
    }
    .summary-card:last-child {
      border-right: none;
    }
    .summary-icon {
      font-size: 24pt;
      margin-bottom: 10px;
    }
    .summary-label {
      font-size: 9pt;
      color: #6b7280;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .summary-value {
      font-size: 18pt;
      font-weight: 700;
      color: #667eea;
    }

    /* SECTIONS */
    .section {
      background: white;
      border-radius: 15px;
      padding: 25px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 3px solid #f3f4f6;
    }
    .section-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18pt;
      margin-right: 15px;
    }
    .section-title {
      font-size: 13pt;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: 0.5px;
    }

    /* INFO GRID */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .info-card {
      padding: 15px;
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-radius: 10px;
      border-left: 4px solid #667eea;
    }
    .info-label {
      font-size: 8pt;
      color: #6b7280;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
      font-weight: 600;
    }
    .info-value {
      font-size: 11pt;
      color: #1a1a1a;
      font-weight: 500;
    }

    /* LICENSE PLATE */
    .vehicle-showcase {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .vehicle-name {
      font-size: 16pt;
      font-weight: 700;
      color: #667eea;
    }
    .license-plate {
      background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16pt;
      font-weight: 900;
      letter-spacing: 3px;
      box-shadow: 0 4px 10px rgba(30, 58, 138, 0.3);
    }

    /* FUEL GAUGE */
    .fuel-display {
      padding: 15px;
      background: #f0fdf4;
      border-radius: 10px;
      border-left: 4px solid #10b981;
    }
    .fuel-label {
      font-size: 9pt;
      color: #059669;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .fuel-bar {
      font-size: 18pt;
      letter-spacing: 3px;
      color: #10b981;
    }

    /* DAMAGES */
    .damage-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .damage-card {
      padding: 15px;
      border-radius: 10px;
      border: 2px solid;
    }
    .damage-card.minor {
      background: #dbeafe;
      border-color: #3b82f6;
    }
    .damage-card.medium {
      background: #fef3c7;
      border-color: #f59e0b;
    }
    .damage-card.major {
      background: #fee2e2;
      border-color: #ef4444;
    }
    .damage-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .damage-title {
      font-weight: 700;
      font-size: 10pt;
    }
    .damage-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 8pt;
      font-weight: 700;
    }
    .damage-badge.minor {
      background: #3b82f6;
      color: white;
    }
    .damage-badge.medium {
      background: #f59e0b;
      color: white;
    }
    .damage-badge.major {
      background: #ef4444;
      color: white;
    }

    /* SIGNATURES */
    .signatures {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
      margin-top: 25px;
    }
    .signature-box {
      text-align: center;
    }
    .signature-area {
      border: 3px dashed #d1d5db;
      border-radius: 12px;
      height: 120px;
      margin-bottom: 15px;
      background: #f9fafb;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
      font-style: italic;
      font-size: 9pt;
    }
    .signature-name {
      font-weight: 700;
      color: #1a1a1a;
      font-size: 11pt;
      margin-bottom: 5px;
    }
    .signature-role {
      font-size: 9pt;
      color: #6b7280;
      letter-spacing: 0.5px;
    }

    /* FOOTER */
    .footer {
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      color: white;
      padding: 20px;
      border-radius: 15px;
      text-align: center;
      margin-top: 30px;
    }
    .footer-brand {
      font-weight: 700;
      font-size: 12pt;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .footer-info {
      font-size: 8pt;
      opacity: 0.7;
      margin-top: 5px;
    }

    @media print {
      body { padding: 10px; background: white; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="header-top">
      <div>
        <div class="company-name">⚡ AGGELOS RENTALS</div>
        <div style="font-size: 10pt; opacity: 0.9; margin-top: 5px;">Rental Cars & Motorbikes</div>
      </div>
      <div class="contract-badge">
        <div class="contract-label">Contract</div>
        <div class="contract-number">#${contractNumber}</div>
        <div style="font-size: 8pt; opacity: 0.8; margin-top: 3px;">${format(new Date(), 'dd/MM/yyyy')}</div>
      </div>
    </div>
    <div class="header-bottom">
      <div class="company-detail">📍 Antiparos Port, Cyclades 84007</div>
      <div class="company-detail">📞 +30 6944950094 | +30 6980151068</div>
      <div class="company-detail">🆔 VAT: 050691970 | MHTE: 1175E81000043400</div>
      <div class="company-detail">✉️ aggelos@antiparosrentacar.com</div>
    </div>
    ${contract.aadeInfo?.status === 'uploaded' ? `
      <div class="aade-badge-modern">
        ✓ ΑΑΔΕ Verified | DCL: ${contract.aadeInfo.dclNumber || 'N/A'}
      </div>
    ` : ''}
  </div>

  <!-- SUMMARY CARDS -->
  <div class="summary-cards">
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-icon">📅</div>
        <div class="summary-label">Διάρκεια</div>
        <div class="summary-value">${duration} ${duration === 1 ? 'Ημέρα' : 'Ημέρες'}</div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">💰</div>
        <div class="summary-label">Συνολικό Κόστος</div>
        <div class="summary-value">€${contract.rentalPeriod.totalCost || 0}</div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">🛡️</div>
        <div class="summary-label">Ασφάλιση</div>
        <div class="summary-value" style="font-size: 12pt;">${contract.insurance || 'Βασική'}</div>
      </div>
    </div>
  </div>

  <!-- VEHICLE INFO -->
  <div class="section">
    <div class="section-header">
      <div class="section-icon">🚗</div>
      <div class="section-title">ΣΤΟΙΧΕΙΑ ΟΧΗΜΑΤΟΣ</div>
    </div>
    
    <div class="vehicle-showcase">
      <div class="vehicle-name">${contract.carInfo.makeModel}</div>
      <div class="license-plate">${contract.carInfo.licensePlate}</div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <div class="info-label">Έτος Κατασκευής</div>
        <div class="info-value">${contract.carInfo.year || 'N/A'}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Χιλιόμετρα</div>
        <div class="info-value">${contract.carCondition?.mileage?.toLocaleString() || 0} km</div>
      </div>
    </div>

    <div class="fuel-display" style="margin-top: 15px;">
      <div class="fuel-label">ΕΠΙΠΕΔΟ ΚΑΥΣΙΜΟΥ</div>
      <div class="fuel-bar">${fuelBars} ${fuelLevel}/8</div>
    </div>
  </div>

  <!-- RENTER INFO -->
  <div class="section">
    <div class="section-header">
      <div class="section-icon">👤</div>
      <div class="section-title">ΣΤΟΙΧΕΙΑ ΕΝΟΙΚΙΑΣΤΗ</div>
    </div>
    
    <div class="info-grid">
      <div class="info-card">
        <div class="info-label">Ονοματεπώνυμο</div>
        <div class="info-value">${contract.renterInfo.fullName}</div>
      </div>
      <div class="info-card">
        <div class="info-label">ΑΔΤ/Διαβατήριο</div>
        <div class="info-value">${contract.renterInfo.idNumber}</div>
      </div>
      <div class="info-card">
        <div class="info-label">ΑΦΜ</div>
        <div class="info-value">${contract.renterInfo.taxId || 'N/A'}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Αριθμός Διπλώματος</div>
        <div class="info-value">${contract.renterInfo.licenseNumber || 'N/A'}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Τηλέφωνο</div>
        <div class="info-value">${contract.renterInfo.phoneNumber}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Email</div>
        <div class="info-value">${contract.renterInfo.email || 'N/A'}</div>
      </div>
    </div>

    <div class="info-card" style="margin-top: 15px;">
      <div class="info-label">Διεύθυνση</div>
      <div class="info-value">${contract.renterInfo.address}</div>
    </div>
  </div>

  <!-- RENTAL PERIOD -->
  <div class="section">
    <div class="section-header">
      <div class="section-icon">📅</div>
      <div class="section-title">ΠΕΡΙΟΔΟΣ ΕΝΟΙΚΙΑΣΗΣ</div>
    </div>
    
    <div class="info-grid">
      <div class="info-card">
        <div class="info-label">Ημ/νια & Ώρα Παραλαβής</div>
        <div class="info-value">${pickupDate} | ${contract.rentalPeriod.pickupTime}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Ημ/νια & Ώρα Επιστροφής</div>
        <div class="info-value">${dropoffDate} | ${contract.rentalPeriod.dropoffTime}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Τοποθεσία Παραλαβής</div>
        <div class="info-value">${contract.rentalPeriod.pickupLocation}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Τοποθεσία Επιστροφής</div>
        <div class="info-value">${contract.rentalPeriod.dropoffLocation || contract.rentalPeriod.pickupLocation}</div>
      </div>
    </div>
  </div>

  <!-- DAMAGES -->
  ${contract.damagePoints && contract.damagePoints.length > 0 ? `
  <div class="section">
    <div class="section-header">
      <div class="section-icon">⚠️</div>
      <div class="section-title">ΚΑΤΑΓΕΓΡΑΜΜΕΝΕΣ ΖΗΜΙΕΣ (${contract.damagePoints.length})</div>
    </div>
    
    <div class="damage-grid">
      ${contract.damagePoints.map((d, i) => {
        const severityClass = d.severity?.toLowerCase() === 'minor' ? 'minor' : 
                             d.severity?.toLowerCase() === 'major' ? 'major' : 'medium';
        const severityLabel = d.severity?.toLowerCase() === 'minor' ? 'Μικρή' : 
                             d.severity?.toLowerCase() === 'major' ? 'Σοβαρή' : 'Μέτρια';
        return `
        <div class="damage-card ${severityClass}">
          <div class="damage-header">
            <span class="damage-title">Ζημιά ${i + 1}: ${d.view || 'N/A'}</span>
            <span class="damage-badge ${severityClass}">${severityLabel}</span>
          </div>
          <div style="font-size: 9pt;">${d.description || 'Χωρίς περιγραφή'}</div>
        </div>
        `;
      }).join('')}
    </div>
  </div>
  ` : ''}

  <!-- SIGNATURES -->
  <div class="section">
    <div class="section-header">
      <div class="section-icon">✍️</div>
      <div class="section-title">ΥΠΟΓΡΑΦΕΣ</div>
    </div>
    
    <div class="signatures">
      <div class="signature-box">
        <div class="signature-area">[Υπογραφή Ενοικιαστή]</div>
        <div class="signature-name">${contract.renterInfo.fullName}</div>
        <div class="signature-role">Ενοικιαστής</div>
      </div>
      <div class="signature-box">
        <div class="signature-area">[Υπογραφή Εκπροσώπου]</div>
        <div class="signature-name">${user.name || 'Aggelos Rentals'}</div>
        <div class="signature-role">Διαχειριστής</div>
      </div>
    </div>

    <div style="text-align: center; margin-top: 25px; padding: 15px; background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-radius: 10px;">
      <em style="color: #6b7280;">Το παρόν συμβόλαιο καταρτίσθηκε και υπογράφηκε ηλεκτρονικά</em>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-brand">⚡ FleetOS</div>
    <div style="font-size: 9pt; opacity: 0.9;">Professional Fleet Management System</div>
    <div class="footer-info">Contract ID: ${contract.id}</div>
    <div class="footer-info">Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
  </div>

  ${RENTAL_TERMS}

</body>
</html>
    `;
  }

  static async sharePDF(uri: string, contractId: string): Promise<void> {
    if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Contract #${contractId.slice(0, 8)}`,
      });
    }
  }
}
