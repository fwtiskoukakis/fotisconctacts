/**
 * TypeScript types for Supabase database schema
 * Auto-generated types based on the database schema
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          signature_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          signature_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          signature_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contracts: {
        Row: {
          id: string;
          user_id: string;
          renter_full_name: string;
          renter_id_number: string;
          renter_tax_id: string;
          renter_driver_license_number: string;
          renter_phone_number: string;
          renter_email: string | null;
          renter_address: string;
          pickup_date: string;
          pickup_time: string;
          pickup_location: string;
          dropoff_date: string;
          dropoff_time: string;
          dropoff_location: string;
          is_different_dropoff_location: boolean;
          total_cost: number;
          car_make_model: string;
          car_year: number;
          car_license_plate: string;
          car_mileage: number;
          fuel_level: number;
          insurance_type: 'basic' | 'full';
          client_signature_url: string | null;
          aade_dcl_id: number | null;
          aade_submitted_at: string | null;
          aade_updated_at: string | null;
          aade_invoice_mark: string | null;
          aade_status: 'pending' | 'submitted' | 'completed' | 'cancelled' | 'error' | null;
          aade_error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          renter_full_name: string;
          renter_id_number: string;
          renter_tax_id: string;
          renter_driver_license_number: string;
          renter_phone_number: string;
          renter_email?: string | null;
          renter_address: string;
          pickup_date: string;
          pickup_time: string;
          pickup_location: string;
          dropoff_date: string;
          dropoff_time: string;
          dropoff_location: string;
          is_different_dropoff_location?: boolean;
          total_cost: number;
          car_make_model: string;
          car_year: number;
          car_license_plate: string;
          car_mileage: number;
          fuel_level: number;
          insurance_type: 'basic' | 'full';
          client_signature_url?: string | null;
          aade_dcl_id?: number | null;
          aade_submitted_at?: string | null;
          aade_updated_at?: string | null;
          aade_invoice_mark?: string | null;
          aade_status?: 'pending' | 'submitted' | 'completed' | 'cancelled' | 'error' | null;
          aade_error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          renter_full_name?: string;
          renter_id_number?: string;
          renter_tax_id?: string;
          renter_driver_license_number?: string;
          renter_phone_number?: string;
          renter_email?: string | null;
          renter_address?: string;
          pickup_date?: string;
          pickup_time?: string;
          pickup_location?: string;
          dropoff_date?: string;
          dropoff_time?: string;
          dropoff_location?: string;
          is_different_dropoff_location?: boolean;
          total_cost?: number;
          car_make_model?: string;
          car_year?: number;
          car_license_plate?: string;
          car_mileage?: number;
          fuel_level?: number;
          insurance_type?: 'basic' | 'full';
          client_signature_url?: string | null;
          aade_dcl_id?: number | null;
          aade_submitted_at?: string | null;
          aade_updated_at?: string | null;
          aade_invoice_mark?: string | null;
          aade_status?: 'pending' | 'submitted' | 'completed' | 'cancelled' | 'error' | null;
          aade_error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      damage_points: {
        Row: {
          id: string;
          contract_id: string;
          x_position: number;
          y_position: number;
          view_side: 'front' | 'rear' | 'left' | 'right';
          description: string;
          severity: 'minor' | 'moderate' | 'severe';
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          x_position: number;
          y_position: number;
          view_side: 'front' | 'rear' | 'left' | 'right';
          description: string;
          severity: 'minor' | 'moderate' | 'severe';
          created_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          x_position?: number;
          y_position?: number;
          view_side?: 'front' | 'rear' | 'left' | 'right';
          description?: string;
          severity?: 'minor' | 'moderate' | 'severe';
          created_at?: string;
        };
      };
      photos: {
        Row: {
          id: string;
          contract_id: string;
          photo_url: string;
          storage_path: string;
          file_size: number | null;
          mime_type: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          photo_url: string;
          storage_path: string;
          file_size?: number | null;
          mime_type?: string | null;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          photo_url?: string;
          storage_path?: string;
          file_size?: number | null;
          mime_type?: string | null;
          order_index?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      contracts_summary: {
        Row: {
          id: string;
          user_id: string;
          user_name: string;
          renter_full_name: string;
          renter_phone_number: string;
          car_make_model: string;
          car_license_plate: string;
          pickup_date: string;
          dropoff_date: string;
          total_cost: number;
          created_at: string;
          damage_count: number;
          photo_count: number;
        };
      };
    };
    Functions: {
      update_updated_at_column: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
  };
}

