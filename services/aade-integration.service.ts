import { supabase } from '../utils/supabase';
import { AADEService } from './aade.service';
import { Contract } from '../models/contract.interface';
import {
  NewDigitalClientDoc,
  UpdateClientRequest,
  AADEResponse,
} from '../models/aade.types';

/**
 * Service for integrating contract operations with AADE
 */
export class AADEIntegrationService {
  /**
   * Submit a new contract to AADE
   */
  static async submitContractToAADE(
    contractId: string,
    contract: Contract
  ): Promise<{ success: boolean; dclId?: number; error?: string }> {
    try {
      // Get company VAT from config
      const companyVat = process.env.EXPO_PUBLIC_COMPANY_VAT_NUMBER;
      if (!companyVat) {
        throw new Error('Company VAT number not configured');
      }

      // Validate customer VAT
      if (!AADEService.isValidVatNumber(contract.renterInfo.taxId)) {
        return {
          success: false,
          error: 'Invalid customer VAT number format',
        };
      }

      // Extract make and model
      const [brand, ...modelParts] = contract.carInfo.makeModel.split(' ');
      const model = modelParts.join(' ');

      // Prepare AADE request
      const aadeRequest: NewDigitalClientDoc = {
        clientServiceType: 1, // Rental
        entityVatNumber: companyVat,
        customerVatNumber: contract.renterInfo.taxId,
        comments: `Ενοικίαση ${contract.carInfo.licensePlate}`,
        rentalDetails: {
          vehiclePlateNumber: contract.carInfo.licensePlate,
          vehicleBrand: brand || undefined,
          vehicleModel: model || undefined,
          vehicleYear: contract.carInfo.year,
          startDateTime: AADEService.formatDateToUTC(contract.rentalPeriod.pickupDate),
          estimatedEndDateTime: AADEService.formatDateToUTC(contract.rentalPeriod.dropoffDate),
          startKm: contract.carInfo.mileage,
          estimatedTotalAmount: contract.rentalPeriod.totalCost,
        },
      };

      // Submit to AADE
      const response: AADEResponse = await AADEService.sendClient(aadeRequest);

      if (response.statusCode === 'Success' && response.newClientDclID) {
        // Update contract in database
        await supabase
          .from('contracts')
          .update({
            aade_dcl_id: response.newClientDclID,
            aade_submitted_at: new Date().toISOString(),
            aade_status: 'submitted',
          })
          .eq('id', contractId);

        return {
          success: true,
          dclId: response.newClientDclID,
        };
      } else {
        // Handle errors
        const errorMessage = response.errors
          ? response.errors.map((e) => e.message).join(', ')
          : 'Unknown error';

        await supabase
          .from('contracts')
          .update({
            aade_status: 'error',
            aade_error_message: errorMessage,
          })
          .eq('id', contractId);

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      console.error('Error submitting contract to AADE:', error);
      
      // Update contract status
      await supabase
        .from('contracts')
        .update({
          aade_status: 'error',
          aade_error_message: (error as Error).message,
        })
        .eq('id', contractId);

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Complete a contract in AADE (when rental ends)
   */
  static async completeContractInAADE(params: {
    contractId: string;
    dclId: number;
    finalAmount: number;
    endKm: number;
    completionDateTime: Date;
    invoiceKind: 1 | 2; // 1=Receipt, 2=Invoice
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const updateRequest: UpdateClientRequest = {
        initialDclId: params.dclId,
        clientServiceType: 1, // Rental
        amount: params.finalAmount,
        completionDateTime: AADEService.formatDateToUTC(params.completionDateTime),
        invoiceKind: params.invoiceKind,
        endKm: params.endKm,
        actualEndDateTime: AADEService.formatDateToUTC(params.completionDateTime),
        comments: 'Ολοκλήρωση ενοικίασης',
      };

      const response: AADEResponse = await AADEService.updateClient(updateRequest);

      if (response.statusCode === 'Success') {
        // Update contract in database
        await supabase
          .from('contracts')
          .update({
            aade_updated_at: new Date().toISOString(),
            aade_status: 'completed',
          })
          .eq('id', params.contractId);

        return { success: true };
      } else {
        const errorMessage = response.errors
          ? response.errors.map((e) => e.message).join(', ')
          : 'Unknown error';

        await supabase
          .from('contracts')
          .update({
            aade_status: 'error',
            aade_error_message: errorMessage,
          })
          .eq('id', params.contractId);

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      console.error('Error completing contract in AADE:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Cancel a contract in AADE
   */
  static async cancelContractInAADE(
    contractId: string,
    dclId: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const companyVat = process.env.EXPO_PUBLIC_COMPANY_VAT_NUMBER;
      if (!companyVat) {
        throw new Error('Company VAT number not configured');
      }

      const response: AADEResponse = await AADEService.cancelClient({
        dclId,
        entityVatNumber: companyVat,
      });

      if (response.statusCode === 'Success') {
        await supabase
          .from('contracts')
          .update({
            aade_status: 'cancelled',
            aade_updated_at: new Date().toISOString(),
          })
          .eq('id', contractId);

        return { success: true };
      } else {
        const errorMessage = response.errors
          ? response.errors.map((e) => e.message).join(', ')
          : 'Unknown error';

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      console.error('Error cancelling contract in AADE:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Correlate contract with invoice
   */
  static async correlateContractWithInvoice(params: {
    contractId: string;
    dclId: number;
    invoiceMark: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const companyVat = process.env.EXPO_PUBLIC_COMPANY_VAT_NUMBER;
      if (!companyVat) {
        throw new Error('Company VAT number not configured');
      }

      const response: AADEResponse = await AADEService.clientCorrelations({
        entityVatNumber: companyVat,
        mark: params.invoiceMark,
        correlatedDCLids: [params.dclId],
      });

      if (response.statusCode === 'Success') {
        await supabase
          .from('contracts')
          .update({
            aade_invoice_mark: params.invoiceMark,
            aade_updated_at: new Date().toISOString(),
          })
          .eq('id', params.contractId);

        return { success: true };
      } else {
        const errorMessage = response.errors
          ? response.errors.map((e) => e.message).join(', ')
          : 'Unknown error';

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      console.error('Error correlating contract with invoice:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Sync all pending contracts with AADE
   */
  static async syncPendingContracts(): Promise<{
    successCount: number;
    errorCount: number;
    errors: Array<{ contractId: string; error: string }>;
  }> {
    try {
      // Get all contracts with pending AADE status
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('*')
        .or('aade_status.is.null,aade_status.eq.pending');

      if (error) {
        throw error;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: Array<{ contractId: string; error: string }> = [];

      for (const contract of contracts || []) {
        // Map database contract to Contract interface
        const mappedContract: Contract = {
          id: contract.id,
          renterInfo: {
            fullName: contract.renter_full_name,
            idNumber: contract.renter_id_number,
            taxId: contract.renter_tax_id,
            driverLicenseNumber: contract.renter_driver_license_number,
            phoneNumber: contract.renter_phone_number,
            email: contract.renter_email || '',
            address: contract.renter_address,
          },
          rentalPeriod: {
            pickupDate: new Date(contract.pickup_date),
            pickupTime: contract.pickup_time,
            pickupLocation: contract.pickup_location,
            dropoffDate: new Date(contract.dropoff_date),
            dropoffTime: contract.dropoff_time,
            dropoffLocation: contract.dropoff_location,
            isDifferentDropoffLocation: contract.is_different_dropoff_location,
            totalCost: parseFloat(contract.total_cost),
          },
          carInfo: {
            makeModel: contract.car_make_model,
            year: contract.car_year,
            licensePlate: contract.car_license_plate,
            mileage: contract.car_mileage,
          },
          carCondition: {
            fuelLevel: contract.fuel_level,
            mileage: contract.car_mileage,
            insuranceType: contract.insurance_type,
          },
          damagePoints: [],
          photoUris: [],
          clientSignature: contract.client_signature_url || '',
          userId: contract.user_id,
          createdAt: new Date(contract.created_at),
        };

        const result = await this.submitContractToAADE(contract.id, mappedContract);

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push({
            contractId: contract.id,
            error: result.error || 'Unknown error',
          });
        }
      }

      return { successCount, errorCount, errors };
    } catch (error) {
      console.error('Error syncing pending contracts:', error);
      throw error;
    }
  }
}

