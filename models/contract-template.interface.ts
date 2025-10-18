import { Contract } from './contract.interface';

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'luxury' | 'commercial' | 'long-term' | 'custom';
  isDefault: boolean;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  templateData: ContractTemplateData;
  usageCount: number;
  tags: string[];
}

export interface ContractTemplateData {
  // Rental Period defaults
  defaultPickupLocation: string;
  defaultDropoffLocation: string;
  defaultPickupTime: string;
  defaultDropoffTime: string;
  defaultDuration: number; // days
  
  // Pricing defaults
  baseDailyRate: number;
  depositAmount: number;
  insuranceCost: number;
  additionalFees: AdditionalFee[];
  
  // Terms and conditions
  termsAndConditions: string;
  cancellationPolicy: string;
  lateReturnPolicy: string;
  
  // Car requirements
  requiredCarFeatures: string[];
  minimumFuelLevel: number;
  
  // Customer requirements
  requiredDocuments: string[];
  minimumAge: number;
  licenseRequirement: string;
  
  // Additional clauses
  customClauses: CustomClause[];
  
  // Notification settings
  reminderSettings: ReminderSettings;
}

export interface AdditionalFee {
  id: string;
  name: string;
  amount: number;
  type: 'fixed' | 'percentage' | 'per_day';
  description: string;
  isOptional: boolean;
}

export interface CustomClause {
  id: string;
  title: string;
  content: string;
  isRequired: boolean;
  category: 'legal' | 'safety' | 'insurance' | 'payment' | 'other';
}

export interface ReminderSettings {
  pickupReminder: {
    enabled: boolean;
    hoursBefore: number;
    message: string;
  };
  returnReminder: {
    enabled: boolean;
    hoursBefore: number;
    message: string;
  };
  paymentReminder: {
    enabled: boolean;
    daysBefore: number;
    message: string;
  };
}

export interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  defaultValue?: any;
  options?: string[];
  isRequired: boolean;
  description: string;
}

export interface ContractFromTemplate {
  templateId: string;
  contractData: Partial<Contract>;
  customVariables: Record<string, any>;
}
