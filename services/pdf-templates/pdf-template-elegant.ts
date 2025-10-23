import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Contract, User } from '../../models/contract.interface';
import { format } from 'date-fns';
import { RENTAL_TERMS } from './rental-terms';

export class PDFTemplateElegant {
  /**
   * Generate Elegant Premium Template PDF
   * Sophisticated design with elegant typography
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
    const fuelBars = '◆'.repeat(fuelLevel) + '◇'.repeat(8 - fuelLevel);

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
      line-height: 1.7;
      color: #1a1a1a;
      background: linear-gradient(135deg, #fdfbfb 0%, #f6f6f6 100%);
      padding: 35px;
    }
    
    /* DECORATIVE BORDER */
    .page-border {
      border: 3px double #c9aa71;
      padding: 30px;
      background: white;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }

    /* HEADER */
    .header {
      text-align: center;
      padding-bottom: 25px;
      margin-bottom: 30px;
      border-bottom: 2px solid #c9aa71;
      position: relative;
    }
    .ornament-top {
      font-size: 20pt;
      color: #c9aa71;
      margin-bottom: 10px;
    }
    .company-name {
      font-size: 26pt;
      font-weight: 400;
      color: #1a1a1a;
      letter-spacing: 4px;
      margin-bottom: 8px;
      font-variant: small-caps;
    }
    .company-subtitle {
      font-size: 10pt;
      color: #666;
      font-style: italic;
      margin-bottom: 15px;
    }
    .company-details {
      font-size: 9pt;
      color: #666;
      line-height: 1.6;
    }
    .contract-badge {
      display: inline-block;
      border: 2px solid #c9aa71;
      padding: 12px 25px;
      margin-top: 15px;
      background: linear-gradient(135deg, #fff9f0 0%, #ffffff 100%);
    }
    .contract-label {
      font-size: 8pt;
      color: #c9aa71;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .contract-number {
      font-size: 14pt;
      font-weight: 600;
      color: #1a1a1a;
      margin-top: 3px;
    }
    .aade-elegant {
      display: inline-block;
      background: linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%);
      color: #c9aa71;
      padding: 6px 15px;
      border-radius: 0;
      font-size: 8pt;
      font-weight: 600;
      letter-spacing: 1px;
      margin-top: 12px;
    }

    /* SUMMARY PANEL */
    .summary-panel {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: #c9aa71;
      padding: 25px;
      margin-bottom: 30px;
      border: 1px solid #c9aa71;
      position: relative;
    }
    .summary-panel::before,
    .summary-panel::after {
      content: '◆';
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      font-size: 14pt;
    }
    .summary-panel::before { left: 10px; }
    .summary-panel::after { right: 10px; }
    .summary-title {
      text-align: center;
      font-size: 11pt;
      font-variant: small-caps;
      letter-spacing: 2px;
      margin-bottom: 20px;
      color: white;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      text-align: center;
    }
    .summary-item {
      padding: 0 15px;
      border-right: 1px solid rgba(201, 170, 113, 0.3);
    }
    .summary-item:last-child {
      border-right: none;
    }
    .summary-label {
      font-size: 8pt;
      letter-spacing: 1px;
      opacity: 0.8;
      margin-bottom: 8px;
    }
    .summary-value {
      font-size: 16pt;
      font-weight: 400;
      color: white;
    }

    /* SECTIONS */
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    .section-ornament {
      font-size: 16pt;
      color: #c9aa71;
      margin-right: 12px;
    }
    .section-title {
      font-size: 12pt;
      font-weight: 500;
      color: #1a1a1a;
      letter-spacing: 2px;
    }

    /* INFO DISPLAY */
    .info-table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-row {
      border-bottom: 1px solid #f5f5f5;
    }
    .info-label {
      padding: 10px 15px;
      font-size: 9pt;
      color: #666;
      letter-spacing: 1px;
      width: 35%;
      background: #fafafa;
    }
    .info-value {
      padding: 10px 15px;
      font-size: 10pt;
      color: #1a1a1a;
      font-weight: 400;
    }

    /* VEHICLE SHOWCASE */
    .vehicle-showcase {
      text-align: center;
      padding: 30px;
      background: linear-gradient(135deg, #fff9f0 0%, #ffffff 100%);
      border: 1px solid #c9aa71;
      margin: 20px 0;
      position: relative;
    }
    .vehicle-showcase::before,
    .vehicle-showcase::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      border: 2px solid #c9aa71;
    }
    .vehicle-showcase::before {
      top: -2px;
      left: -2px;
      border-right: none;
      border-bottom: none;
    }
    .vehicle-showcase::after {
      bottom: -2px;
      right: -2px;
      border-left: none;
      border-top: none;
    }
    .vehicle-name {
      font-size: 18pt;
      font-weight: 400;
      color: #1a1a1a;
      margin-bottom: 15px;
      font-variant: small-caps;
      letter-spacing: 2px;
    }
    .license-plate {
      display: inline-block;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: #c9aa71;
      padding: 12px 30px;
      font-size: 16pt;
      font-weight: 700;
      letter-spacing: 5px;
      border: 2px solid #c9aa71;
      margin-bottom: 15px;
    }
    .vehicle-details {
      display: flex;
      justify-content: center;
      gap: 40px;
      font-size: 10pt;
      color: #666;
      margin-top: 15px;
    }

    /* FUEL GAUGE */
    .fuel-elegant {
      text-align: center;
      padding: 15px;
      margin-top: 15px;
    }
    .fuel-label {
      font-size: 8pt;
      color: #c9aa71;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }
    .fuel-bar {
      font-size: 16pt;
      letter-spacing: 4px;
      color: #c9aa71;
    }

    /* DAMAGES */
    .damage-elegant {
      margin-bottom: 15px;
      padding: 15px;
      background: #fafafa;
      border-left: 4px solid #c9aa71;
    }
    .damage-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .damage-location {
      font-size: 10pt;
      font-weight: 600;
      color: #1a1a1a;
    }
    .damage-tag {
      font-size: 7pt;
      letter-spacing: 1px;
      padding: 3px 10px;
      border: 1px solid;
    }
    .damage-tag.minor {
      color: #666;
      border-color: #ccc;
    }
    .damage-tag.medium {
      color: #c9aa71;
      border-color: #c9aa71;
    }
    .damage-tag.major {
      color: #1a1a1a;
      border-color: #1a1a1a;
      font-weight: 700;
    }
    .damage-description {
      font-size: 9pt;
      color: #666;
      font-style: italic;
    }

    /* SIGNATURES */
    .signatures-elegant {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 40px;
      margin-top: 35px;
    }
    .signature-elegant {
      text-align: center;
    }
    .signature-space {
      border-bottom: 2px solid #1a1a1a;
      height: 100px;
      margin-bottom: 15px;
      position: relative;
      background: #fafafa;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 8px;
    }
    .signature-placeholder {
      color: #ccc;
      font-size: 9pt;
      font-style: italic;
    }
    .signature-name {
      font-size: 11pt;
      font-weight: 500;
      color: #1a1a1a;
      margin-bottom: 5px;
    }
    .signature-role {
      font-size: 8pt;
      color: #c9aa71;
      letter-spacing: 2px;
    }

    /* FOOTER */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #c9aa71;
      text-align: center;
    }
    .ornament-bottom {
      font-size: 16pt;
      color: #c9aa71;
      margin-bottom: 10px;
    }
    .footer-brand {
      font-size: 12pt;
      font-weight: 500;
      color: #c9aa71;
      font-variant: small-caps;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }
    .footer-text {
      font-size: 8pt;
      color: #666;
      line-height: 1.6;
    }

    @media print {
      body { padding: 10px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

<div class="page-border">

  <!-- HEADER -->
  <div class="header">
    <div class="ornament-top">◆ ◆ ◆</div>
    <div class="company-name">AGGELOS RENTALS</div>
    <div class="company-subtitle">Luxury Car & Motorbike Rental Services</div>
    <div class="company-details">
      Antiparos Port, Cyclades 84007, Greece<br>
      ☎ +30 6944950094 | +30 6980151068<br>
      ✉ aggelos@antiparosrentacar.com<br>
      VAT: 050691970 | MHTE: 1175E81000043400
    </div>
    <div class="contract-badge">
      <div class="contract-label">Rental Contract</div>
      <div class="contract-number">#${contractNumber}</div>
      <div style="font-size: 8pt; color: #999; margin-top: 5px;">${format(new Date(), 'dd MMMM yyyy')}</div>
    </div>
    ${contract.aadeInfo?.status === 'uploaded' ? `
      <div class="aade-elegant">
        ✓ ΑΑΔΕ CERTIFIED | DCL: ${contract.aadeInfo.dclNumber || 'N/A'}
      </div>
    ` : ''}
  </div>

  <!-- SUMMARY PANEL -->
  <div class="summary-panel">
    <div class="summary-title">Contract Summary</div>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-label">Duration</div>
        <div class="summary-value">${duration} ${duration === 1 ? 'Day' : 'Days'}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Cost</div>
        <div class="summary-value">€${contract.rentalPeriod.totalCost || 0}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Insurance</div>
        <div class="summary-value" style="font-size: 12pt;">${contract.insurance || 'Basic'}</div>
      </div>
    </div>
  </div>

  <!-- VEHICLE -->
  <div class="section">
    <div class="section-header">
      <span class="section-ornament">◆</span>
      <span class="section-title">ΣΤΟΙΧΕΙΑ ΟΧΗΜΑΤΟΣ</span>
    </div>
    
    <div class="vehicle-showcase">
      <div class="vehicle-name">${contract.carInfo.makeModel}</div>
      <div class="license-plate">${contract.carInfo.licensePlate}</div>
      <div class="vehicle-details">
        <span>Year: ${contract.carInfo.year || 'N/A'}</span>
        <span style="color: #c9aa71;">◆</span>
        <span>Mileage: ${contract.carCondition?.mileage?.toLocaleString() || 0} km</span>
      </div>
    </div>

    <div class="fuel-elegant">
      <div class="fuel-label">Fuel Level</div>
      <div class="fuel-bar">${fuelBars} ${fuelLevel}/8</div>
    </div>
  </div>

  <!-- RENTER -->
  <div class="section">
    <div class="section-header">
      <span class="section-ornament">◆</span>
      <span class="section-title">ΣΤΟΙΧΕΙΑ ΕΝΟΙΚΙΑΣΤΗ</span>
    </div>
    
    <table class="info-table">
      <tr class="info-row">
        <td class="info-label">Full Name</td>
        <td class="info-value">${contract.renterInfo.fullName}</td>
      </tr>
      <tr class="info-row">
        <td class="info-label">ID / Passport</td>
        <td class="info-value">${contract.renterInfo.idNumber}</td>
      </tr>
      <tr class="info-row">
        <td class="info-label">Tax ID (ΑΦΜ)</td>
        <td class="info-value">${contract.renterInfo.taxId || 'N/A'}</td>
      </tr>
      <tr class="info-row">
        <td class="info-label">License Number</td>
        <td class="info-value">${contract.renterInfo.licenseNumber || 'N/A'}</td>
      </tr>
      <tr class="info-row">
        <td class="info-label">Phone</td>
        <td class="info-value">${contract.renterInfo.phoneNumber}</td>
      </tr>
      <tr class="info-row">
        <td class="info-label">Email</td>
        <td class="info-value">${contract.renterInfo.email || 'N/A'}</td>
      </tr>
      <tr class="info-row">
        <td class="info-label">Address</td>
        <td class="info-value">${contract.renterInfo.address}</td>
      </tr>
    </table>
  </div>

  <!-- RENTAL PERIOD -->
  <div class="section">
    <div class="section-header">
      <span class="section-ornament">◆</span>
      <span class="section-title">ΠΕΡΙΟΔΟΣ ΕΝΟΙΚΙΑΣΗΣ</span>
    </div>
    
    <table class="info-table">
      <tr class="info-row">
        <td class="info-label">Pick-up</td>
        <td class="info-value">${pickupDate} at ${contract.rentalPeriod.pickupTime}</td>
      </tr>
      <tr class="info-row">
        <td class="info-label">Drop-off</td>
        <td class="info-value">${dropoffDate} at ${contract.rentalPeriod.dropoffTime}</td>
      </tr>
      <tr class="info-row">
        <td class="info-label">Pick-up Location</td>
        <td class="info-value">${contract.rentalPeriod.pickupLocation}</td>
      </tr>
      <tr class="info-row">
        <td class="info-label">Drop-off Location</td>
        <td class="info-value">${contract.rentalPeriod.dropoffLocation || contract.rentalPeriod.pickupLocation}</td>
      </tr>
    </table>
  </div>

  <!-- DAMAGES -->
  ${contract.damagePoints && contract.damagePoints.length > 0 ? `
  <div class="section">
    <div class="section-header">
      <span class="section-ornament">◆</span>
      <span class="section-title">ΚΑΤΑΓΕΓΡΑΜΜΕΝΕΣ ΖΗΜΙΕΣ (${contract.damagePoints.length})</span>
    </div>
    
    ${contract.damagePoints.map((d, i) => {
      const severityClass = d.severity?.toLowerCase() === 'minor' ? 'minor' : 
                           d.severity?.toLowerCase() === 'major' ? 'major' : 'medium';
      const severityLabel = d.severity?.toLowerCase() === 'minor' ? 'Minor' : 
                           d.severity?.toLowerCase() === 'major' ? 'Major' : 'Medium';
      return `
      <div class="damage-elegant">
        <div class="damage-header">
          <span class="damage-location">${i + 1}. ${d.view || 'N/A'}</span>
          <span class="damage-tag ${severityClass}">${severityLabel}</span>
        </div>
        <div class="damage-description">${d.description || 'No description provided'}</div>
      </div>
      `;
    }).join('')}
  </div>
  ` : ''}

  <!-- SIGNATURES -->
  <div class="section">
    <div class="section-header">
      <span class="section-ornament">◆</span>
      <span class="section-title">ΥΠΟΓΡΑΦΕΣ</span>
    </div>
    
    <div class="signatures-elegant">
      <div class="signature-elegant">
        <div class="signature-space">
          <span class="signature-placeholder">[Signature]</span>
        </div>
        <div class="signature-name">${contract.renterInfo.fullName}</div>
        <div class="signature-role">Renter</div>
      </div>
      <div class="signature-elegant">
        <div class="signature-space">
          <span class="signature-placeholder">[Signature]</span>
        </div>
        <div class="signature-name">${user.name || 'Aggelos Rentals'}</div>
        <div class="signature-role">Representative</div>
      </div>
    </div>

    <div style="text-align: center; margin-top: 30px; padding: 15px; background: #fafafa; border: 1px solid #e0e0e0;">
      <em style="color: #666; font-size: 9pt;">This contract has been electronically signed and is legally binding</em>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="ornament-bottom">◆ ◆ ◆</div>
    <div class="footer-brand">⚡ FleetOS Premium</div>
    <div class="footer-text">
      Contract Reference: ${contract.id}<br>
      Document generated on ${format(new Date(), 'dd/MM/yyyy')} at ${format(new Date(), 'HH:mm')}<br>
      © ${new Date().getFullYear()} Aggelos Rentals. All rights reserved.
    </div>
  </div>

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
