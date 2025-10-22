/**
 * Car interface matching the existing cars table schema
 */

export type CarStatus = 'available' | 'rented' | 'maintenance' | 'retired';
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid';
export type Transmission = 'manual' | 'automatic';

export interface Car {
  id: string;
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
}

export interface CarSummary {
  car: Car | null;
  lastContract: any | null;
  totalContracts: number;
  totalDamages: number;
  recentDamages: any[];
}
