import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Contract, User } from '../../models/contract.interface';
import { format } from 'date-fns';
import { RENTAL_TERMS } from './rental-terms';

export class PDFTemplateClassic {
  /**
   * Generate Classic Business Template PDF
   * Traditional professional layout with company header
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
      font-family: 'Roboto', 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #2c3e50;
      background: #ffffff;
      padding: 30px;
    }
    
    /* HEADER */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px double #2c3e50;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .header-left {
      flex: 1;
    }
    .company-name {
      font-size: 22pt;
      font-weight: bold;
      color: #2c3e50;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }
    .company-subtitle {
      font-size: 10pt;
      color: #7f8c8d;
      margin-bottom: 15px;
    }
    .company-details {
      font-size: 9pt;
      color: #5a6c7d;
      line-height: 1.6;
    }
    .header-right {
      text-align: right;
    }
    .contract-title {
      font-size: 16pt;
      font-weight: bold;
      color: #2c3e50;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .contract-number {
      font-size: 11pt;
      color: #95a5a6;
    }
    .contract-date {
      font-size: 9pt;
      color: #95a5a6;
      margin-top: 5px;
    }
    .aade-badge {
      display: inline-block;
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      padding: 8px 15px;
      border-radius: 20px;
      font-size: 9pt;
      font-weight: bold;
      margin-top: 10px;
    }

    /* RENTAL SUMMARY BOX */
    .summary-box {
      background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .summary-title {
      font-size: 12pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 15px;
      letter-spacing: 1px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      text-align: center;
    }
    .summary-item {
      border-right: 1px solid rgba(255,255,255,0.2);
    }
    .summary-item:last-child {
      border-right: none;
    }
    .summary-label {
      font-size: 9pt;
      opacity: 0.8;
      margin-bottom: 5px;
    }
    .summary-value {
      font-size: 14pt;
      font-weight: bold;
    }

    /* SECTIONS */
    .section {
      background: #fff;
      border: 2px solid #ecf0f1;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .section-header {
      display: flex;
      align-items: center;
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .section-icon {
      font-size: 18pt;
      margin-right: 10px;
    }
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #2c3e50;
      letter-spacing: 1px;
    }

    /* INFO GRID */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .info-item {
      padding: 10px;
      background: #f8f9fa;
      border-radius: 4px;
      border-left: 3px solid #3498db;
    }
    .info-label {
      font-size: 9pt;
      color: #7f8c8d;
      font-weight: bold;
      margin-bottom: 3px;
    }
    .info-value {
      font-size: 10pt;
      color: #2c3e50;
      font-weight: normal;
    }

    /* LICENSE PLATE */
    .license-plate {
      display: inline-block;
      background: #003399;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14pt;
      font-weight: bold;
      letter-spacing: 2px;
      border: 2px solid #001f66;
      margin: 10px 0;
    }

    /* FUEL GAUGE */
    .fuel-gauge {
      margin: 10px 0;
    }
    .fuel-label {
      font-size: 9pt;
      color: #7f8c8d;
      margin-bottom: 5px;
    }
    .fuel-bar {
      font-size: 16pt;
      letter-spacing: 2px;
      color: #28a745;
    }

    /* DAMAGES */
    .damage-item {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 10px;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .damage-item.minor {
      background: #d1ecf1;
      border-left-color: #17a2b8;
    }
    .damage-item.medium {
      background: #fff3cd;
      border-left-color: #ffc107;
    }
    .damage-item.major {
      background: #f8d7da;
      border-left-color: #dc3545;
    }
    .damage-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .damage-severity {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 8pt;
      font-weight: bold;
    }
    .damage-severity.minor {
      background: #17a2b8;
      color: white;
    }
    .damage-severity.medium {
      background: #ffc107;
      color: #000;
    }
    .damage-severity.major {
      background: #dc3545;
      color: white;
    }

    /* SIGNATURES */
    .signatures {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
      margin-top: 30px;
    }
    .signature-box {
      text-align: center;
    }
    .signature-line {
      border: 2px solid #2c3e50;
      border-radius: 8px;
      height: 100px;
      margin-bottom: 10px;
      background: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #95a5a6;
      font-style: italic;
    }
    .signature-name {
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 3px;
    }
    .signature-role {
      font-size: 9pt;
      color: #7f8c8d;
    }

    /* FOOTER */
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 2px solid #ecf0f1;
      text-align: center;
      font-size: 9pt;
      color: #95a5a6;
    }
    .footer-brand {
      font-weight: bold;
      color: #3498db;
      font-size: 11pt;
      margin-bottom: 5px;
    }

    @media print {
      body { padding: 15px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      <div class="company-name">AGGELOS RENTALS</div>
      <div class="company-subtitle">Rental Cars & Motorbikes</div>
      <div class="company-details">
        <div><strong>VAT:</strong> 050691970 | <strong>MHTE:</strong> 1175E81000043400</div>
        <div>Antiparos Port, Cyclades 84007</div>
        <div>📞 +30 6944950094 | +30 6980151068</div>
        <div>✉️ aggelos@antiparosrentacar.com</div>
        <div>🌐 www.antiparosrentacar.com</div>
      </div>
      ${contract.aadeInfo?.status === 'uploaded' ? `
        <div class="aade-badge">
          ✓ Ανεβασμένο στην ΑΑΔΕ | DCL: ${contract.aadeInfo.dclNumber || 'N/A'}
        </div>
      ` : ''}
    </div>
    <div class="header-right">
      <div class="contract-title">ΣΥΜΒΟΛΑΙΟ</div>
      <div class="contract-number">#${contractNumber}</div>
      <div class="contract-date">Ημερομηνία: ${format(new Date(), 'dd/MM/yyyy')}</div>
    </div>
  </div>

  <!-- RENTAL SUMMARY -->
  <div class="summary-box">
    <div class="summary-title">ΠΕΡΙΛΗΨΗ ΕΝΟΙΚΙΑΣΗΣ</div>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-label">Διάρκεια</div>
        <div class="summary-value">${duration} ${duration === 1 ? 'Ημέρα' : 'Ημέρες'}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Συνολικό Κόστος</div>
        <div class="summary-value">€${contract.rentalPeriod.totalCost || 0}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Ασφάλιση</div>
        <div class="summary-value">${contract.insurance || 'Βασική'}</div>
      </div>
    </div>
  </div>

  <!-- VEHICLE INFO -->
  <div class="section">
    <div class="section-header">
      <span class="section-icon">🚗</span>
      <span class="section-title">ΣΤΟΙΧΕΙΑ ΟΧΗΜΑΤΟΣ</span>
    </div>
    
    <div style="margin-bottom: 15px;">
      <div style="font-size: 14pt; font-weight: bold; color: #2c3e50; margin-bottom: 10px;">
        ${contract.carInfo.makeModel}
      </div>
      <div class="license-plate">${contract.carInfo.licensePlate}</div>
    </div>

    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Έτος</div>
        <div class="info-value">${contract.carInfo.year || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Χιλιόμετρα</div>
        <div class="info-value">${contract.carCondition?.mileage?.toLocaleString() || 0} km</div>
      </div>
    </div>

    <div class="fuel-gauge">
      <div class="fuel-label">Επίπεδο Καυσίμου:</div>
      <div class="fuel-bar">${fuelBars} (${fuelLevel}/8)</div>
    </div>
  </div>

  <!-- RENTER INFO -->
  <div class="section">
    <div class="section-header">
      <span class="section-icon">👤</span>
      <span class="section-title">ΣΤΟΙΧΕΙΑ ΕΝΟΙΚΙΑΣΤΗ</span>
    </div>
    
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Ονοματεπώνυμο</div>
        <div class="info-value">${contract.renterInfo.fullName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">ΑΔΤ/Διαβατήριο</div>
        <div class="info-value">${contract.renterInfo.idNumber}</div>
      </div>
      <div class="info-item">
        <div class="info-label">ΑΦΜ</div>
        <div class="info-value">${contract.renterInfo.taxId || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Δίπλωμα</div>
        <div class="info-value">${contract.renterInfo.licenseNumber || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Τηλέφωνο</div>
        <div class="info-value">${contract.renterInfo.phoneNumber}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Email</div>
        <div class="info-value">${contract.renterInfo.email || 'N/A'}</div>
      </div>
    </div>

    <div class="info-item" style="margin-top: 15px; grid-column: 1 / -1;">
      <div class="info-label">Διεύθυνση</div>
      <div class="info-value">${contract.renterInfo.address}</div>
    </div>
  </div>

  <!-- RENTAL PERIOD -->
  <div class="section">
    <div class="section-header">
      <span class="section-icon">📅</span>
      <span class="section-title">ΠΕΡΙΟΔΟΣ ΕΝΟΙΚΙΑΣΗΣ</span>
    </div>
    
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Παραλαβή</div>
        <div class="info-value">${pickupDate} | ${contract.rentalPeriod.pickupTime}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Επιστροφή</div>
        <div class="info-value">${dropoffDate} | ${contract.rentalPeriod.dropoffTime}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Τοποθεσία Παραλαβής</div>
        <div class="info-value">${contract.rentalPeriod.pickupLocation}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Τοποθεσία Επιστροφής</div>
        <div class="info-value">${contract.rentalPeriod.dropoffLocation || contract.rentalPeriod.pickupLocation}</div>
      </div>
    </div>
  </div>

  <!-- DAMAGES -->
  ${contract.damagePoints && contract.damagePoints.length > 0 ? `
  <div class="section">
    <div class="section-header">
      <span class="section-icon">⚠️</span>
      <span class="section-title">ΚΑΤΑΓΕΓΡΑΜΜΕΝΕΣ ΖΗΜΙΕΣ (${contract.damagePoints.length})</span>
    </div>
    
    ${contract.damagePoints.map((d, i) => {
      const severityClass = d.severity?.toLowerCase() === 'minor' ? 'minor' : 
                           d.severity?.toLowerCase() === 'major' ? 'major' : 'medium';
      const severityLabel = d.severity?.toLowerCase() === 'minor' ? 'Μικρή' : 
                           d.severity?.toLowerCase() === 'major' ? 'Σοβαρή' : 'Μέτρια';
      return `
      <div class="damage-item ${severityClass}">
        <div class="damage-header">
          <span><strong>Ζημιά ${i + 1}:</strong> ${d.view || 'N/A'}</span>
          <span class="damage-severity ${severityClass}">${severityLabel}</span>
        </div>
        <div>${d.description || 'Χωρίς περιγραφή'}</div>
      </div>
      `;
    }).join('')}
  </div>
  ` : ''}

  <!-- SIGNATURES -->
  <div class="section">
    <div class="section-header">
      <span class="section-icon">✍️</span>
      <span class="section-title">ΥΠΟΓΡΑΦΕΣ</span>
    </div>
    
    <div class="signatures">
      <div class="signature-box">
        <div class="signature-line">[Υπογραφή Ενοικιαστή]</div>
        <div class="signature-name">${contract.renterInfo.fullName}</div>
        <div class="signature-role">Ενοικιαστής</div>
      </div>
      <div class="signature-box">
        <div class="signature-line">[Υπογραφή Εκπροσώπου]</div>
        <div class="signature-name">${user.name || 'Aggelos Rentals'}</div>
        <div class="signature-role">Διαχειριστής / Agent</div>
      </div>
    </div>

    <div style="text-align: center; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px;">
      <em>Το παρόν συμβόλαιο καταρτίσθηκε και υπογράφηκε ηλεκτρονικά</em>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-brand">⚡ FleetOS - Fleet Management System</div>
    <div>Contract ID: ${contract.id}</div>
    <div>Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
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
