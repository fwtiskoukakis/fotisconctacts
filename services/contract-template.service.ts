import { supabase } from '../utils/supabase';
import { ContractTemplate, ContractTemplateData, ContractFromTemplate, TemplateVariable } from '../models/contract-template.interface';
import { Contract } from '../models/contract.interface';

export class ContractTemplateService {
  static async getAllTemplates(): Promise<ContractTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching contract templates:', error);
      throw error;
    }
  }

  static async getTemplateById(id: string): Promise<ContractTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching contract template:', error);
      return null;
    }
  }

  static async createTemplate(template: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<ContractTemplate> {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .insert({
          ...template,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          usage_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating contract template:', error);
      throw error;
    }
  }

  static async updateTemplate(id: string, updates: Partial<ContractTemplate>): Promise<ContractTemplate> {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating contract template:', error);
      throw error;
    }
  }

  static async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting contract template:', error);
      throw error;
    }
  }

  static async incrementUsageCount(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('contract_templates')
        .update({
          usage_count: supabase.raw('usage_count + 1'),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing usage count:', error);
      throw error;
    }
  }

  static async getTemplatesByCategory(category: string): Promise<ContractTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('category', category)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching templates by category:', error);
      throw error;
    }
  }

  static async getPublicTemplates(): Promise<ContractTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('is_public', true)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching public templates:', error);
      throw error;
    }
  }

  static async createContractFromTemplate(templateData: ContractFromTemplate): Promise<Contract> {
    try {
      const template = await this.getTemplateById(templateData.templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Increment usage count
      await this.incrementUsageCount(templateData.templateId);

      // Generate contract from template
      const contract = this.generateContractFromTemplate(template, templateData);
      
      return contract;
    } catch (error) {
      console.error('Error creating contract from template:', error);
      throw error;
    }
  }

  private static generateContractFromTemplate(template: ContractTemplate, templateData: ContractFromTemplate): Contract {
    const now = new Date();
    const pickupDate = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // Tomorrow
    const dropoffDate = new Date(pickupDate.getTime() + (template.templateData.defaultDuration * 24 * 60 * 60 * 1000));

    return {
      id: `contract_${Date.now()}`,
      createdAt: now.toISOString(),
      status: 'upcoming',
      
      // Renter info from template data or defaults
      renterInfo: {
        fullName: templateData.customVariables.renterName || '',
        email: templateData.customVariables.renterEmail || '',
        phone: templateData.customVariables.renterPhone || '',
        address: templateData.customVariables.renterAddress || '',
        idNumber: templateData.customVariables.renterIdNumber || '',
        licenseNumber: templateData.customVariables.licenseNumber || '',
        licenseExpiry: templateData.customVariables.licenseExpiry || '',
      },

      // Rental period from template
      rentalPeriod: {
        pickupDate: pickupDate.toISOString(),
        dropoffDate: dropoffDate.toISOString(),
        pickupTime: template.templateData.defaultPickupTime,
        dropoffTime: template.templateData.defaultDropoffTime,
        pickupLocation: template.templateData.defaultPickupLocation,
        dropoffLocation: template.templateData.defaultDropoffLocation,
        totalCost: this.calculateTotalCost(template.templateData, templateData.customVariables),
        depositAmount: template.templateData.depositAmount,
        insuranceCost: template.templateData.insuranceCost,
      },

      // Car info from template data
      carInfo: {
        make: templateData.customVariables.carMake || '',
        model: templateData.customVariables.carModel || '',
        year: templateData.customVariables.carYear || new Date().getFullYear(),
        licensePlate: templateData.customVariables.licensePlate || '',
        color: templateData.customVariables.carColor || '',
        makeModel: `${templateData.customVariables.carMake || ''} ${templateData.customVariables.carModel || ''}`.trim(),
      },

      // Car condition defaults
      carCondition: {
        fuelLevel: template.templateData.minimumFuelLevel,
        mileage: templateData.customVariables.mileage || 0,
        exteriorCondition: 'excellent',
        interiorCondition: 'excellent',
        mechanicalCondition: 'excellent',
        notes: '',
      },

      // Damage points empty
      damagePoints: [],

      // Terms and conditions from template
      termsAndConditions: template.templateData.termsAndConditions,
      cancellationPolicy: template.templateData.cancellationPolicy,
      lateReturnPolicy: template.templateData.lateReturnPolicy,

      // Additional data
      additionalFees: template.templateData.additionalFees,
      customClauses: template.templateData.customClauses,
      reminderSettings: template.templateData.reminderSettings,
    };
  }

  private static calculateTotalCost(templateData: ContractTemplateData, customVariables: Record<string, any>): number {
    const duration = customVariables.duration || templateData.defaultDuration;
    const baseCost = templateData.baseDailyRate * duration;
    
    let totalCost = baseCost + templateData.insuranceCost;
    
    // Add additional fees
    templateData.additionalFees.forEach(fee => {
      if (!fee.isOptional || customVariables[`fee_${fee.id}`]) {
        switch (fee.type) {
          case 'fixed':
            totalCost += fee.amount;
            break;
          case 'percentage':
            totalCost += (baseCost * fee.amount) / 100;
            break;
          case 'per_day':
            totalCost += fee.amount * duration;
            break;
        }
      }
    });

    return totalCost;
  }

  // Default templates
  static getDefaultTemplates(): ContractTemplate[] {
    return [
      {
        id: 'standard_template',
        name: 'Standard Car Rental',
        description: 'Basic car rental template for everyday use',
        category: 'standard',
        isDefault: true,
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        tags: ['basic', 'standard', 'daily'],
        templateData: {
          defaultPickupLocation: 'Office',
          defaultDropoffLocation: 'Office',
          defaultPickupTime: '09:00',
          defaultDropoffTime: '17:00',
          defaultDuration: 1,
          baseDailyRate: 50,
          depositAmount: 100,
          insuranceCost: 10,
          additionalFees: [
            {
              id: 'late_fee',
              name: 'Late Return Fee',
              amount: 25,
              type: 'per_day',
              description: 'Additional charge for late returns',
              isOptional: false,
            },
          ],
          termsAndConditions: 'Standard rental terms apply. Customer is responsible for any damages.',
          cancellationPolicy: 'Free cancellation up to 24 hours before pickup.',
          lateReturnPolicy: 'Late returns subject to additional fees.',
          requiredCarFeatures: ['Air Conditioning', 'Power Steering'],
          minimumFuelLevel: 6,
          requiredDocuments: ['Driver License', 'ID Card'],
          minimumAge: 21,
          licenseRequirement: 'Valid driver license required',
          customClauses: [
            {
              id: 'fuel_clause',
              title: 'Fuel Policy',
              content: 'Vehicle must be returned with same fuel level as pickup.',
              isRequired: true,
              category: 'safety',
            },
          ],
          reminderSettings: {
            pickupReminder: {
              enabled: true,
              hoursBefore: 2,
              message: 'Reminder: Your car rental pickup is scheduled in 2 hours.',
            },
            returnReminder: {
              enabled: true,
              hoursBefore: 2,
              message: 'Reminder: Your car rental return is due in 2 hours.',
            },
            paymentReminder: {
              enabled: true,
              daysBefore: 1,
              message: 'Reminder: Payment is due tomorrow.',
            },
          },
        },
      },
      {
        id: 'luxury_template',
        name: 'Luxury Car Rental',
        description: 'Premium car rental template for luxury vehicles',
        category: 'luxury',
        isDefault: true,
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        tags: ['luxury', 'premium', 'high-end'],
        templateData: {
          defaultPickupLocation: 'Office',
          defaultDropoffLocation: 'Office',
          defaultPickupTime: '10:00',
          defaultDropoffTime: '18:00',
          defaultDuration: 1,
          baseDailyRate: 150,
          depositAmount: 500,
          insuranceCost: 25,
          additionalFees: [
            {
              id: 'luxury_fee',
              name: 'Luxury Service Fee',
              amount: 50,
              type: 'fixed',
              description: 'Premium service fee for luxury vehicles',
              isOptional: false,
            },
          ],
          termsAndConditions: 'Luxury vehicle rental terms. Strict damage policy applies.',
          cancellationPolicy: 'Free cancellation up to 48 hours before pickup.',
          lateReturnPolicy: 'Late returns subject to premium fees.',
          requiredCarFeatures: ['Leather Seats', 'Navigation', 'Premium Sound'],
          minimumFuelLevel: 8,
          requiredDocuments: ['Driver License', 'ID Card', 'Credit Card'],
          minimumAge: 25,
          licenseRequirement: 'Valid driver license with clean record required',
          customClauses: [
            {
              id: 'luxury_damage',
              title: 'Luxury Damage Policy',
              content: 'Any damage to luxury vehicle will result in immediate charges.',
              isRequired: true,
              category: 'legal',
            },
          ],
          reminderSettings: {
            pickupReminder: {
              enabled: true,
              hoursBefore: 4,
              message: 'Reminder: Your luxury car rental pickup is scheduled in 4 hours.',
            },
            returnReminder: {
              enabled: true,
              hoursBefore: 4,
              message: 'Reminder: Your luxury car rental return is due in 4 hours.',
            },
            paymentReminder: {
              enabled: true,
              daysBefore: 2,
              message: 'Reminder: Luxury vehicle payment is due in 2 days.',
            },
          },
        },
      },
    ];
  }
}
