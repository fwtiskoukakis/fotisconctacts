import * as MailComposer from 'expo-mail-composer';
import { Alert, Platform } from 'react-native';
import { Contract } from '../models/contract.interface';

export interface EmailOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: string[];
  isHTML?: boolean;
}

export interface ContractEmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'pickup_reminder' | 'dropoff_reminder' | 'contract_confirmation' | 'payment_reminder' | 'custom';
}

export class EmailService {
  /**
   * Check if email is available on the device
   */
  static async isAvailable(): Promise<boolean> {
    try {
      return await MailComposer.isAvailableAsync();
    } catch (error) {
      console.error('Error checking mail availability:', error);
      return false;
    }
  }

  /**
   * Send email using device's default email client
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        Alert.alert('Σφάλμα', 'Η λειτουργία email δεν είναι διαθέσιμη σε αυτή τη συσκευή');
        return false;
      }

      const mailOptions: MailComposer.MailComposerOptions = {
        recipients: options.to,
        ccRecipients: options.cc,
        bccRecipients: options.bcc,
        subject: options.subject,
        body: options.body,
        isHtml: options.isHTML || false,
        attachments: options.attachments,
      };

      const result = await MailComposer.composeAsync(mailOptions);
      return result.status === MailComposer.MailComposerStatus.SENT;
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία αποστολής email');
      return false;
    }
  }

  /**
   * Send contract confirmation email
   */
  static async sendContractConfirmation(contract: Contract): Promise<boolean> {
    const template = EmailService.getContractEmailTemplate('contract_confirmation');
    const emailBody = this.generateContractEmailBody(contract, template);
    
    const emailOptions: EmailOptions = {
      to: [contract.renterInfo.email],
      subject: template.subject.replace('{contractId}', contract.id),
      body: emailBody,
      isHTML: true,
    };

    return this.sendEmail(emailOptions);
  }

  /**
   * Send pickup reminder email
   */
  static async sendPickupReminder(contract: Contract): Promise<boolean> {
    const template = EmailService.getContractEmailTemplate('pickup_reminder');
    const emailBody = this.generateContractEmailBody(contract, template);
    
    const emailOptions: EmailOptions = {
      to: [contract.renterInfo.email],
      subject: template.subject.replace('{pickupDate}', new Date(contract.rentalPeriod.pickupDate).toLocaleDateString('el-GR')),
      body: emailBody,
      isHTML: true,
    };

    return this.sendEmail(emailOptions);
  }

  /**
   * Send dropoff reminder email
   */
  static async sendDropoffReminder(contract: Contract): Promise<boolean> {
    const template = EmailService.getContractEmailTemplate('dropoff_reminder');
    const emailBody = this.generateContractEmailBody(contract, template);
    
    const emailOptions: EmailOptions = {
      to: [contract.renterInfo.email],
      subject: template.subject.replace('{dropoffDate}', new Date(contract.rentalPeriod.dropoffDate).toLocaleDateString('el-GR')),
      body: emailBody,
      isHTML: true,
    };

    return this.sendEmail(emailOptions);
  }

  /**
   * Send payment reminder email
   */
  static async sendPaymentReminder(contract: Contract): Promise<boolean> {
    const template = EmailService.getContractEmailTemplate('payment_reminder');
    const emailBody = this.generateContractEmailBody(contract, template);
    
    const emailOptions: EmailOptions = {
      to: [contract.renterInfo.email],
      subject: template.subject.replace('{amount}', contract.rentalPeriod.totalCost.toString()),
      body: emailBody,
      isHTML: true,
    };

    return this.sendEmail(emailOptions);
  }

  /**
   * Send bulk email to multiple contracts
   */
  static async sendBulkEmail(contracts: Contract[], template: ContractEmailTemplate): Promise<boolean> {
    try {
      const recipients = contracts.map(contract => contract.renterInfo.email).filter(email => email);
      
      if (recipients.length === 0) {
        Alert.alert('Σφάλμα', 'Δεν βρέθηκαν έγκυρα email addresses');
        return false;
      }

      const emailBody = this.generateBulkEmailBody(contracts, template);
      
      const emailOptions: EmailOptions = {
        to: recipients,
        subject: template.subject,
        body: emailBody,
        isHTML: true,
      };

      return this.sendEmail(emailOptions);
    } catch (error) {
      console.error('Error sending bulk email:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία αποστολής μαζικού email');
      return false;
    }
  }

  /**
   * Get email template by type
   */
  static getContractEmailTemplate(type: string): ContractEmailTemplate {
    const templates: Record<string, ContractEmailTemplate> = {
      contract_confirmation: {
        id: 'contract_confirmation',
        name: 'Επιβεβαίωση Συμβολαίου',
        subject: 'Επιβεβαίωση Συμβολαίου Ενοικίασης #{contractId}',
        body: `
          <h2>Επιβεβαίωση Συμβολαίου Ενοικίασης</h2>
          <p>Αγαπητέ/ή κ. {renterName},</p>
          <p>Επιβεβαιώνουμε την ενοικίαση του οχήματος <strong>{carInfo}</strong> με πινακίδα <strong>{licensePlate}</strong>.</p>
          <h3>Στοιχεία Συμβολαίου:</h3>
          <ul>
            <li><strong>Ημερομηνία Παραλαβής:</strong> {pickupDate}</li>
            <li><strong>Ημερομηνία Επιστροφής:</strong> {dropoffDate}</li>
            <li><strong>Συνολικό Κόστος:</strong> €{totalCost}</li>
            <li><strong>Ποσό Εγγύησης:</strong> €{depositAmount}</li>
          </ul>
          <p>Σας ευχαριστούμε για την επιλογή μας!</p>
        `,
        type: 'contract_confirmation',
      },
      pickup_reminder: {
        id: 'pickup_reminder',
        name: 'Υπενθύμιση Παραλαβής',
        subject: 'Υπενθύμιση: Παραλαβή Οχήματος - {pickupDate}',
        body: `
          <h2>Υπενθύμιση Παραλαβής Οχήματος</h2>
          <p>Αγαπητέ/ή κ. {renterName},</p>
          <p>Σας υπενθυμίζουμε ότι αύριο στις <strong>{pickupTime}</strong> έχετε προγραμματισμένη την παραλαβή του οχήματος <strong>{carInfo}</strong>.</p>
          <p><strong>Τοποθεσία Παραλαβής:</strong> {pickupLocation}</p>
          <p>Παρακαλώ φέρετε μαζί σας:</p>
          <ul>
            <li>Δίπλωμα οδήγησης</li>
            <li>Ταυτότητα ή διαβατήριο</li>
            <li>ΑΦΜ</li>
          </ul>
        `,
        type: 'pickup_reminder',
      },
      dropoff_reminder: {
        id: 'dropoff_reminder',
        name: 'Υπενθύμιση Επιστροφής',
        subject: 'Υπενθύμιση: Επιστροφή Οχήματος - {dropoffDate}',
        body: `
          <h2>Υπενθύμιση Επιστροφής Οχήματος</h2>
          <p>Αγαπητέ/ή κ. {renterName},</p>
          <p>Σας υπενθυμίζουμε ότι αύριο στις <strong>{dropoffTime}</strong> έχετε προγραμματισμένη την επιστροφή του οχήματος <strong>{carInfo}</strong>.</p>
          <p><strong>Τοποθεσία Επιστροφής:</strong> {dropoffLocation}</p>
          <p>Παρακαλώ βεβαιωθείτε ότι:</p>
          <ul>
            <li>Το όχημα είναι καθαρό</li>
            <li>Το καύσιμο είναι στο ίδιο επίπεδο με την παραλαβή</li>
            <li>Δεν υπάρχουν νέες ζημιές</li>
          </ul>
        `,
        type: 'dropoff_reminder',
      },
      payment_reminder: {
        id: 'payment_reminder',
        name: 'Υπενθύμιση Πληρωμής',
        subject: 'Υπενθύμιση: Εκκρεμής Πληρωμή - €{amount}',
        body: `
          <h2>Υπενθύμιση Πληρωμής</h2>
          <p>Αγαπητέ/ή κ. {renterName},</p>
          <p>Σας υπενθυμίζουμε ότι έχετε εκκρεμή πληρωμή €<strong>{amount}</strong> για το συμβόλαιο ενοικίασης #{contractId}.</p>
          <p>Παρακαλώ ολοκληρώστε την πληρωμή σας το συντομότερο δυνατό.</p>
        `,
        type: 'payment_reminder',
      },
    };

    return templates[type] || templates.contract_confirmation;
  }

  /**
   * Generate email body for a single contract
   */
  private static generateContractEmailBody(contract: Contract, template: ContractEmailTemplate): string {
    const pickupDate = new Date(contract.rentalPeriod.pickupDate).toLocaleDateString('el-GR');
    const dropoffDate = new Date(contract.rentalPeriod.dropoffDate).toLocaleDateString('el-GR');
    
    return template.body
      .replace(/{renterName}/g, contract.renterInfo.fullName)
      .replace(/{carInfo}/g, contract.carInfo.makeModel)
      .replace(/{licensePlate}/g, contract.carInfo.licensePlate)
      .replace(/{pickupDate}/g, pickupDate)
      .replace(/{dropoffDate}/g, dropoffDate)
      .replace(/{pickupTime}/g, contract.rentalPeriod.pickupTime)
      .replace(/{dropoffTime}/g, contract.rentalPeriod.dropoffTime)
      .replace(/{pickupLocation}/g, contract.rentalPeriod.pickupLocation)
      .replace(/{dropoffLocation}/g, contract.rentalPeriod.dropoffLocation)
      .replace(/{totalCost}/g, contract.rentalPeriod.totalCost.toString())
      .replace(/{depositAmount}/g, contract.rentalPeriod.depositAmount.toString())
      .replace(/{contractId}/g, contract.id);
  }

  /**
   * Generate email body for bulk email
   */
  private static generateBulkEmailBody(contracts: Contract[], template: ContractEmailTemplate): string {
    const contractsList = contracts.map(contract => {
      const pickupDate = new Date(contract.rentalPeriod.pickupDate).toLocaleDateString('el-GR');
      return `
        <li>
          <strong>${contract.renterInfo.fullName}</strong> - 
          ${contract.carInfo.makeModel} (${contract.carInfo.licensePlate}) - 
          Παράλαβη: ${pickupDate}
        </li>
      `;
    }).join('');

    return `
      <h2>${template.name}</h2>
      <p>Αγαπητοί Ενοικιαστές,</p>
      <p>Ακολουθεί η λίστα με τα συμβόλαια που αφορούν:</p>
      <ul>
        ${contractsList}
      </ul>
      <p>Σας ευχαριστούμε!</p>
    `;
  }
}
