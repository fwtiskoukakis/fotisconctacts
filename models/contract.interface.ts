export interface RenterInfo {
  fullName: string;
  idNumber: string;
  taxId: string; // ΑΦΜ - Tax Identification Number
  driverLicenseNumber: string;
  phoneNumber: string;
  email: string;
  address: string;
}

export interface RentalPeriod {
  pickupDate: Date;
  pickupTime: string;
  pickupLocation: string;
  dropoffDate: Date;
  dropoffTime: string;
  dropoffLocation: string;
  isDifferentDropoffLocation: boolean;
  totalCost: number;
}

export interface CarCondition {
  fuelLevel: number; // 1-8 scale (1/8 to 8/8)
  mileage: number; // kilometers
  insuranceType: 'basic' | 'full';
}

export interface CarInfo {
  makeModel: string; // Combined make and model
  year: number;
  licensePlate: string;
  mileage: number;
}

export interface DamagePoint {
  id: string;
  x: number; // percentage position
  y: number; // percentage position
  view: 'front' | 'rear' | 'left' | 'right'; // which side of the car
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
  timestamp: Date;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  signature: string; // Base64 encoded signature image
  signatureUrl?: string; // URL to signature in Supabase storage
  // AADE Integration Fields
  aadeUserId?: string; // AADE User ID for myDATA
  aadeSubscriptionKey?: string; // AADE Subscription Key
  companyVatNumber?: string; // Company VAT Number (ΑΦΜ)
  companyName?: string; // Company legal name
  companyAddress?: string; // Company registered address
  companyActivity?: string; // Company business activity
  aadeEnabled?: boolean; // Whether AADE integration is enabled
  createdAt: Date;
  updatedAt?: Date;
}

export interface Contract {
  id: string;
  renterInfo: RenterInfo;
  rentalPeriod: RentalPeriod;
  carInfo: CarInfo;
  carCondition: CarCondition;
  damagePoints: DamagePoint[];
  photoUris: string[];
  clientSignature: string; // Base64 encoded signature image
  userId: string; // ID of the user who created the contract
  status: 'active' | 'completed' | 'upcoming'; // Calculated from rental dates
  aadeStatus?: 'pending' | 'submitted' | 'completed' | 'cancelled' | 'error' | null; // AADE submission status
  aadeDclId?: number | null; // AADE Digital Client ID
  createdAt: Date;
}

