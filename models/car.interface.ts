/**
 * Car interface matching the existing cars table schema
 */

export type CarStatus = 'available' | 'rented' | 'maintenance' | 'retired';
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid';
export type Transmission = 'manual' | 'automatic';

export interface Car {
  id: string;
  userId?: string | null;
  make: string;
  model: string;
  makeModel: string; // Generated field: make + ' ' + model
  year?: number | null;
  licensePlate: string;
  color?: string | null;
  fuelType?: FuelType | null;
  transmission?: Transmission | null;
  seats?: number | null;
  dailyRate?: number | null;
  isAvailable?: boolean | null;
  photoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  description?: string | null;
  features?: string | null;
  images?: string[] | null;
  agency?: string | null;
  island?: string | null;
  category?: string | null;
  status?: CarStatus | null;
  type?: string | null;
  
  // KTEO Information (from vehicles table)
  kteoLastDate?: Date | null;
  kteoExpiryDate?: Date | null;
  
  // Insurance Information (enhanced from vehicles table)
  insuranceExpiryDate?: Date | null;
  insuranceCompany?: string | null;
  insurancePolicyNumber?: string | null;
  
  // Tire Information (from vehicles table)
  tiresFrontDate?: Date | null;
  tiresFrontBrand?: string | null;
  tiresRearDate?: Date | null;
  tiresRearBrand?: string | null;
  
  // Notes (from vehicles table)
  notes?: string | null;
}

export interface CarSummary {
  car: Car | null;
  lastContract: any | null;
  totalContracts: number;
  totalDamages: number;
  recentDamages: any[];
}
