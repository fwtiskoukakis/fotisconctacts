import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Contract, User } from '../../models/contract.interface';
import { format } from 'date-fns';
import { RENTAL_TERMS } from './rental-terms';

export class PDFTemplateMinimal {
  /**
   * Generate Minimal Simple Template PDF
   * Clean minimalist layout, easy to read
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
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.8;
      color: #333;
      background: #fff;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    /* HEADER */
    .header {
      padding-bottom: 30px;
      margin-bottom: 30px;
      border-bottom: 1px solid #e0e0e0;
    }
    .header-grid {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .company-name {
      font-size: 20pt;
      font-weight: 300;
      color: #000;
      letter-spacing: 2px;
      margin-bottom: 5px;
    }
    .company-info {
      font-size: 9pt;
      color: #666;
      line-height: 1.6;
      margin-top: 10px;
    }
    .contract-info {
      text-align: right;
    }
    .contract-label {
      font-size: 9pt;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .contract-number {
      font-size: 18pt;
      font-weight: 300;
      color: #000;
      margin: 5px 0;
    }
    .contract-date {
      font-size: 9pt;
      color: #666;
    }
    .aade-simple {
      display: inline-block;
      background: #000;
      color: white;
      padding: 5px 12px;
      font-size: 8pt;
      margin-top: 8px;
    }

    /* SUMMARY */
    .summary {
      display: flex;
      justify-content: space-around;
      padding: 25px 0;
      margin-bottom: 30px;
      border-top: 1px solid #e0e0e0;
      border-bottom: 1px solid #e0e0e0;
    }
    .summary-item {
      text-align: center;
    }
    .summary-label {
      font-size: 8pt;
      color: #999;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .summary-value {
      font-size: 16pt;
      font-weight: 300;
      color: #000;
    }

    /* SECTIONS */
    .section {
      margin-bottom: 35px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 600;
      color: #000;
      letter-spacing: 1px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #000;
    }

    /* INFO ROWS */
    .info-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .info-label {
      flex: 0 0 180px;
      font-size: 9pt;
      color: #999;
      letter-spacing: 0.5px;
    }
    .info-value {
      flex: 1;
      font-size: 10pt;
      color: #333;
    }

    /* VEHICLE SHOWCASE */
    .vehicle-hero {
      text-align: center;
      padding: 25px 0;
      margin: 20px 0;
    }
    .vehicle-name {
      font-size: 18pt;
      font-weight: 300;
      color: #000;
      margin-bottom: 15px;
    }
    .license-plate {
      display: inline-block;
      background: #000;
      color: white;
      padding: 10px 25px;
      font-size: 16pt;
      font-weight: 400;
      letter-spacing: 4px;
      margin-bottom: 20px;
    }
    .vehicle-stats {
      display: flex;
      justify-content: center;
      gap: 40px;
      font-size: 9pt;
      color: #666;
    }

    /* FUEL */
    .fuel-display {
      text-align: center;
      margin: 20px 0;
    }
    .fuel-label {
      font-size: 8pt;
      color: #999;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .fuel-bar {
      font-size: 16pt;
      letter-spacing: 3px;
      color: #000;
    }

    /* DAMAGES */
    .damage-list {
      list-style: none;
    }
    .damage-item {
      padding: 12px;
      margin-bottom: 10px;
      border-left: 3px solid #000;
      background: #fafafa;
    }
    .damage-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .damage-location {
      font-weight: 600;
      font-size: 10pt;
    }
    .damage-severity {
      font-size: 8pt;
      letter-spacing: 0.5px;
    }
    .damage-severity.minor { color: #666; }
    .damage-severity.medium { color: #000; }
    .damage-severity.major { color: #000; font-weight: 700; }
    .damage-description {
      font-size: 9pt;
      color: #666;
    }

    /* SIGNATURES */
    .signatures {
      display: flex;
      justify-content: space-between;
      gap: 40px;
      margin-top: 40px;
    }
    .signature-box {
      flex: 1;
      text-align: center;
    }
    .signature-line {
      border-bottom: 2px solid #000;
      height: 80px;
      margin-bottom: 15px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 10px;
      color: #ccc;
      font-size: 9pt;
      font-style: italic;
    }
    .signature-name {
      font-size: 10pt;
      color: #000;
      margin-bottom: 3px;
    }
    .signature-role {
      font-size: 8pt;
      color: #999;
      letter-spacing: 1px;
    }

    /* FOOTER */
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      font-size: 8pt;
      color: #999;
    }
    .footer-brand {
      font-weight: 600;
      color: #000;
      margin-bottom: 5px;
    }

    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="header-grid">
      <div>
        <div class="company-name">AGGELOS RENTALS</div>
        <div class="company-info">
          Antiparos Port, Cyclades 84007<br>
          +30 6944950094 | +30 6980151068<br>
          aggelos@antiparosrentacar.com<br>
          VAT: 050691970 | MHTE: 1175E81000043400
        </div>
        ${contract.aadeInfo?.status === 'uploaded' ? `
          <div class="aade-simple">
            ✓ ΑΑΔΕ | DCL: ${contract.aadeInfo.dclNumber || 'N/A'}
          </div>
        ` : ''}
      </div>
      <div class="contract-info">
        <div class="contract-label">Contract</div>
        <div class="contract-number">#${contractNumber}</div>
        <div class="contract-date">${format(new Date(), 'dd/MM/yyyy')}</div>
      </div>
    </div>
  </div>

  <!-- SUMMARY -->
  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Διάρκεια</div>
      <div class="summary-value">${duration} ${duration === 1 ? 'Ημέρα' : 'Ημέρες'}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Κόστος</div>
      <div class="summary-value">€${contract.rentalPeriod.totalCost || 0}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Ασφάλιση</div>
      <div class="summary-value" style="font-size: 12pt;">${contract.insurance || 'Βασική'}</div>
    </div>
  </div>

  <!-- VEHICLE -->
  <div class="section">
    <div class="section-title">ΟΧΗΜΑ</div>
    
    <div class="vehicle-hero">
      <div class="vehicle-name">${contract.carInfo.makeModel}</div>
      <div class="license-plate">${contract.carInfo.licensePlate}</div>
      <div class="vehicle-stats">
        <span>Έτος: ${contract.carInfo.year || 'N/A'}</span>
        <span>•</span>
        <span>Χλμ: ${contract.carCondition?.mileage?.toLocaleString() || 0}</span>
      </div>
    </div>

    <div class="fuel-display">
      <div class="fuel-label">Καύσιμο</div>
      <div class="fuel-bar">${fuelBars} ${fuelLevel}/8</div>
    </div>
  </div>

  <!-- RENTER -->
  <div class="section">
    <div class="section-title">ΕΝΟΙΚΙΑΣΤΗΣ</div>
    
    <div class="info-row">
      <div class="info-label">Ονοματεπώνυμο</div>
      <div class="info-value">${contract.renterInfo.fullName}</div>
    </div>
    <div class="info-row">
      <div class="info-label">ΑΔΤ/Διαβατήριο</div>
      <div class="info-value">${contract.renterInfo.idNumber}</div>
    </div>
    <div class="info-row">
      <div class="info-label">ΑΦΜ</div>
      <div class="info-value">${contract.renterInfo.taxId || 'N/A'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Δίπλωμα</div>
      <div class="info-value">${contract.renterInfo.licenseNumber || 'N/A'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Τηλέφωνο</div>
      <div class="info-value">${contract.renterInfo.phoneNumber}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Email</div>
      <div class="info-value">${contract.renterInfo.email || 'N/A'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Διεύθυνση</div>
      <div class="info-value">${contract.renterInfo.address}</div>
    </div>
  </div>

  <!-- RENTAL PERIOD -->
  <div class="section">
    <div class="section-title">ΠΕΡΙΟΔΟΣ ΕΝΟΙΚΙΑΣΗΣ</div>
    
    <div class="info-row">
      <div class="info-label">Παραλαβή</div>
      <div class="info-value">${pickupDate} στις ${contract.rentalPeriod.pickupTime}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Επιστροφή</div>
      <div class="info-value">${dropoffDate} στις ${contract.rentalPeriod.dropoffTime}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Τοποθεσία Παραλαβής</div>
      <div class="info-value">${contract.rentalPeriod.pickupLocation}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Τοποθεσία Επιστροφής</div>
      <div class="info-value">${contract.rentalPeriod.dropoffLocation || contract.rentalPeriod.pickupLocation}</div>
    </div>
  </div>

  <!-- DAMAGES -->
  ${contract.damagePoints && contract.damagePoints.length > 0 ? `
  <div class="section">
    <div class="section-title">ΖΗΜΙΕΣ (${contract.damagePoints.length})</div>
    
    <ul class="damage-list">
      ${contract.damagePoints.map((d, i) => {
        const severityClass = d.severity?.toLowerCase() === 'minor' ? 'minor' : 
                             d.severity?.toLowerCase() === 'major' ? 'major' : 'medium';
        const severityLabel = d.severity?.toLowerCase() === 'minor' ? 'Μικρή' : 
                             d.severity?.toLowerCase() === 'major' ? 'Σοβαρή' : 'Μέτρια';
        return `
        <li class="damage-item">
          <div class="damage-header">
            <span class="damage-location">${i + 1}. ${d.view || 'N/A'}</span>
            <span class="damage-severity ${severityClass}">${severityLabel}</span>
          </div>
          <div class="damage-description">${d.description || 'Χωρίς περιγραφή'}</div>
        </li>
        `;
      }).join('')}
    </ul>
  </div>
  ` : ''}

  <!-- SIGNATURES -->
  <div class="section">
    <div class="section-title">ΥΠΟΓΡΑΦΕΣ</div>
    
    <div class="signatures">
      <div class="signature-box">
        <div class="signature-line">[Υπογραφή]</div>
        <div class="signature-name">${contract.renterInfo.fullName}</div>
        <div class="signature-role">Ενοικιαστής</div>
      </div>
      <div class="signature-box">
        <div class="signature-line">[Υπογραφή]</div>
        <div class="signature-name">${user.name || 'Aggelos Rentals'}</div>
        <div class="signature-role">Εκπρόσωπος</div>
      </div>
    </div>

    <div style="text-align: center; margin-top: 30px; color: #999; font-size: 9pt;">
      <em>Ηλεκτρονικά Υπογεγραμμένο Έγγραφο</em>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-brand">FleetOS</div>
    <div>Contract: ${contract.id}</div>
    <div>${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
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
