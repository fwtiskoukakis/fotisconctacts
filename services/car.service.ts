/**
 * Car Service
 * Handles all car-related database operations with Supabase
 * Works with the existing 'cars' table
 */

import { supabase } from '../utils/supabase';
import { Car, CarSummary } from '../models/car.interface';

/**
 * Converts a database row to a Car object
 */
function convertRowToCar(row: any): Car {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    makeModel: row.make_model,
    year: row.year,
    licensePlate: row.license_plate,
    color: row.color,
    fuelType: row.fuel_type,
    transmission: row.transmission,
    seats: row.seats,
    dailyRate: row.daily_rate ? parseFloat(row.daily_rate) : null,
    isAvailable: row.is_available,
    photoUrl: row.photo_url,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    description: row.description,
    features: row.features,
    images: row.images,
    agency: row.agency,
    island: row.island,
    category: row.category,
    status: row.status,
    type: row.type,
  };
}

/**
 * Converts a Car object to database insert format
 */
function convertCarToInsert(car: Omit<Car, 'id' | 'makeModel' | 'createdAt' | 'updatedAt'>): any {
  return {
    make: car.make,
    model: car.model,
    year: car.year,
    license_plate: car.licensePlate,
    color: car.color,
    fuel_type: car.fuelType,
    transmission: car.transmission,
    seats: car.seats,
    daily_rate: car.dailyRate,
    is_available: car.isAvailable,
    photo_url: car.photoUrl,
    description: car.description,
    features: car.features,
    images: car.images,
    agency: car.agency,
    island: car.island,
    category: car.category,
    status: car.status,
    type: car.type,
  };
}

export class CarService {
  /**
   * Get all cars
   */
  static async getAllCars(): Promise<Car[]> {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('license_plate', { ascending: true });

    if (error) {
      console.error('Error fetching cars:', error);
      throw new Error(`Failed to fetch cars: ${error.message}`);
    }

    return data ? data.map(convertRowToCar) : [];
  }

  /**
   * Get a car by ID
   */
  static async getCarById(id: string): Promise<Car | null> {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching car:', error);
      throw new Error(`Failed to fetch car: ${error.message}`);
    }

    return data ? convertRowToCar(data) : null;
  }

  /**
   * Get a car by license plate
   */
  static async getCarByPlate(licensePlate: string): Promise<Car | null> {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('license_plate', licensePlate)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching car:', error);
      throw new Error(`Failed to fetch car: ${error.message}`);
    }

    return data ? convertRowToCar(data) : null;
  }

  /**
   * Create a new car
   */
  static async createCar(car: Omit<Car, 'id' | 'makeModel' | 'createdAt' | 'updatedAt'>): Promise<Car> {
    const insertData = convertCarToInsert(car);

    const { data, error } = await supabase
      .from('cars')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating car:', error);
      throw new Error(`Failed to create car: ${error.message}`);
    }

    return convertRowToCar(data);
  }

  /**
   * Update a car
   */
  static async updateCar(id: string, updates: Partial<Omit<Car, 'id' | 'makeModel' | 'createdAt'>>): Promise<Car> {
    const updateData: any = {
      ...(updates.make && { make: updates.make }),
      ...(updates.model && { model: updates.model }),
      ...(updates.year !== undefined && { year: updates.year }),
      ...(updates.licensePlate && { license_plate: updates.licensePlate }),
      ...(updates.color !== undefined && { color: updates.color }),
      ...(updates.fuelType !== undefined && { fuel_type: updates.fuelType }),
      ...(updates.transmission !== undefined && { transmission: updates.transmission }),
      ...(updates.seats !== undefined && { seats: updates.seats }),
      ...(updates.dailyRate !== undefined && { daily_rate: updates.dailyRate }),
      ...(updates.isAvailable !== undefined && { is_available: updates.isAvailable }),
      ...(updates.photoUrl !== undefined && { photo_url: updates.photoUrl }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.features !== undefined && { features: updates.features }),
      ...(updates.images !== undefined && { images: updates.images }),
      ...(updates.agency !== undefined && { agency: updates.agency }),
      ...(updates.island !== undefined && { island: updates.island }),
      ...(updates.category !== undefined && { category: updates.category }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.type !== undefined && { type: updates.type }),
    };

    const { data, error } = await supabase
      .from('cars')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating car:', error);
      throw new Error(`Failed to update car: ${error.message}`);
    }

    return convertRowToCar(data);
  }

  /**
   * Delete a car
   */
  static async deleteCar(id: string): Promise<void> {
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting car:', error);
      throw new Error(`Failed to delete car: ${error.message}`);
    }
  }

  /**
   * Search cars by text
   */
  static async searchCars(query: string): Promise<Car[]> {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .or(`license_plate.ilike.%${query}%,make.ilike.%${query}%,model.ilike.%${query}%`)
      .order('license_plate', { ascending: true });

    if (error) {
      console.error('Error searching cars:', error);
      throw new Error(`Failed to search cars: ${error.message}`);
    }

    return data ? data.map(convertRowToCar) : [];
  }

  /**
   * Get available cars
   */
  static async getAvailableCars(): Promise<Car[]> {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('is_available', true)
      .order('license_plate', { ascending: true });

    if (error) {
      console.error('Error fetching available cars:', error);
      throw new Error(`Failed to fetch available cars: ${error.message}`);
    }

    return data ? data.map(convertRowToCar) : [];
  }

  /**
   * Get cars by category
   */
  static async getCarsByCategory(category: string): Promise<Car[]> {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('category', category)
      .order('license_plate', { ascending: true });

    if (error) {
      console.error('Error fetching cars by category:', error);
      throw new Error(`Failed to fetch cars: ${error.message}`);
    }

    return data ? data.map(convertRowToCar) : [];
  }
}
