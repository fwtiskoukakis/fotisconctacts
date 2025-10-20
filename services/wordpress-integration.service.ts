import { supabase } from '../utils/supabase';
import { Integration, Vehicle, ImportJob, ImportMapping } from '../models/multi-tenant.types';

export interface WordPressConfig {
  url: string;
  username: string;
  password: string;
  consumerKey?: string;
  consumerSecret?: string;
  version?: string;
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  sale_price: string;
  images: Array<{
    id: number;
    src: string;
    name: string;
    alt: string;
  }>;
  attributes: Array<{
    id: number;
    name: string;
    options: string[];
    visible: boolean;
    variation: boolean;
  }>;
  meta_data: Array<{
    id: number;
    key: string;
    value: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  status: string;
  stock_quantity: number;
  manage_stock: boolean;
  stock_status: string;
  sku: string;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ImportMappingConfig {
  [key: string]: string; // WooCommerce field -> Vehicle field
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  importedVehicles: Vehicle[];
}

export class WordPressIntegrationService {
  /**
   * Test WordPress/WooCommerce connection
   */
  static async testConnection(config: WordPressConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${config.url}/wp-json/wc/v3/products?per_page=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${config.consumerKey}:${config.consumerSecret}`)}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Connection failed' };
      }
    } catch (error) {
      return { success: false, error: error.message || 'Connection failed' };
    }
  }

  /**
   * Get WooCommerce products
   */
  static async getWooCommerceProducts(config: WordPressConfig, page = 1, perPage = 100): Promise<WooCommerceProduct[]> {
    try {
      const response = await fetch(
        `${config.url}/wp-json/wc/v3/products?page=${page}&per_page=${perPage}&status=publish`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(`${config.consumerKey}:${config.consumerSecret}`)}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const products = await response.json();
      return products;
    } catch (error) {
      console.error('Error fetching WooCommerce products:', error);
      throw error;
    }
  }

  /**
   * Get all WooCommerce products with pagination
   */
  static async getAllWooCommerceProducts(config: WordPressConfig): Promise<WooCommerceProduct[]> {
    try {
      let allProducts: WooCommerceProduct[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const products = await this.getWooCommerceProducts(config, page, 100);
        allProducts = [...allProducts, ...products];
        
        hasMore = products.length === 100;
        page++;
      }

      return allProducts;
    } catch (error) {
      console.error('Error fetching all WooCommerce products:', error);
      throw error;
    }
  }

  /**
   * Map WooCommerce product to vehicle
   */
  static mapProductToVehicle(product: WooCommerceProduct, mapping: ImportMappingConfig): Partial<Vehicle> {
    const vehicle: Partial<Vehicle> = {};

    // Apply field mappings
    Object.entries(mapping).forEach(([wooField, vehicleField]) => {
      let value: any = null;

      switch (wooField) {
        case 'name':
          value = product.name;
          break;
        case 'description':
          value = product.description;
          break;
        case 'price':
          value = parseFloat(product.price) || 0;
          break;
        case 'regular_price':
          value = parseFloat(product.regular_price) || 0;
          break;
        case 'sale_price':
          value = parseFloat(product.sale_price) || null;
          break;
        case 'sku':
          value = product.sku;
          break;
        case 'weight':
          value = parseFloat(product.weight) || null;
          break;
        case 'stock_quantity':
          value = product.stock_quantity || null;
          break;
        case 'stock_status':
          value = product.stock_status === 'instock' ? 'available' : 'unavailable';
          break;
        case 'status':
          value = product.status === 'publish' ? 'active' : 'inactive';
          break;
        case 'created_at':
          value = product.created_at;
          break;
        case 'updated_at':
          value = product.updated_at;
          break;
        default:
          // Check meta data
          const metaItem = product.meta_data.find(meta => meta.key === wooField);
          if (metaItem) {
            value = metaItem.value;
          }
          // Check attributes
          const attribute = product.attributes.find(attr => attr.name.toLowerCase() === wooField.toLowerCase());
          if (attribute && attribute.options.length > 0) {
            value = attribute.options[0];
          }
          break;
      }

      if (value !== null) {
        vehicle[vehicleField] = value;
      }
    });

    // Handle images
    if (product.images && product.images.length > 0) {
      vehicle.images = product.images.map(img => ({
        url: img.src,
        alt: img.alt || img.name,
        is_primary: img.id === product.images[0].id,
      }));
    }

    // Handle categories as vehicle types
    if (product.categories && product.categories.length > 0) {
      vehicle.vehicle_type = product.categories[0].name.toLowerCase();
    }

    return vehicle;
  }

  /**
   * Import vehicles from WooCommerce
   */
  static async importVehiclesFromWooCommerce(
    organizationId: string,
    config: WordPressConfig,
    mapping: ImportMappingConfig,
    options: {
      updateExisting?: boolean;
      skipDuplicates?: boolean;
      category?: string;
      branchId?: string;
    } = {}
  ): Promise<ImportResult> {
    try {
      // Create import job
      const { data: job, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          organization_id: organizationId,
          integration_type: 'woocommerce',
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (jobError) throw jobError;

      const result: ImportResult = {
        success: true,
        imported: 0,
        skipped: 0,
        errors: [],
        importedVehicles: [],
      };

      try {
        // Fetch products from WooCommerce
        const products = await this.getAllWooCommerceProducts(config);

        for (const product of products) {
          try {
            // Map product to vehicle
            const vehicleData = this.mapProductToVehicle(product, mapping);

            // Skip if required fields are missing
            if (!vehicleData.license_plate && !vehicleData.make && !vehicleData.model) {
              result.skipped++;
              result.errors.push(`Product "${product.name}" skipped: Missing required fields`);
              continue;
            }

            // Check for duplicates
            if (options.skipDuplicates) {
              const { data: existingVehicle } = await supabase
                .from('vehicles')
                .select('id')
                .eq('organization_id', organizationId)
                .or(`license_plate.eq.${vehicleData.license_plate},make.eq.${vehicleData.make},model.eq.${vehicleData.model}`)
                .single();

              if (existingVehicle) {
                result.skipped++;
                continue;
              }
            }

            // Prepare vehicle data
            const vehicle = {
              ...vehicleData,
              organization_id: organizationId,
              branch_id: options.branchId || null,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            if (options.updateExisting) {
              // Update existing vehicle or create new one
              const { data: existingVehicle } = await supabase
                .from('vehicles')
                .select('id')
                .eq('organization_id', organizationId)
                .eq('license_plate', vehicle.license_plate)
                .single();

              if (existingVehicle) {
                const { data: updatedVehicle, error: updateError } = await supabase
                  .from('vehicles')
                  .update({
                    ...vehicle,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', existingVehicle.id)
                  .select()
                  .single();

                if (updateError) throw updateError;
                result.importedVehicles.push(updatedVehicle);
              } else {
                const { data: newVehicle, error: createError } = await supabase
                  .from('vehicles')
                  .insert(vehicle)
                  .select()
                  .single();

                if (createError) throw createError;
                result.importedVehicles.push(newVehicle);
              }
            } else {
              // Create new vehicle
              const { data: newVehicle, error: createError } = await supabase
                .from('vehicles')
                .insert(vehicle)
                .select()
                .single();

              if (createError) throw createError;
              result.importedVehicles.push(newVehicle);
            }

            result.imported++;
          } catch (error) {
            result.errors.push(`Error processing product "${product.name}": ${error.message}`);
          }
        }

        // Update job status
        await supabase
          .from('import_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result: {
              imported: result.imported,
              skipped: result.skipped,
              errors: result.errors,
            },
          })
          .eq('id', job.id);

      } catch (error) {
        // Update job status to failed
        await supabase
          .from('import_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error: error.message,
          })
          .eq('id', job.id);

        result.success = false;
        result.errors.push(error.message);
      }

      return result;
    } catch (error) {
      console.error('Error importing vehicles from WooCommerce:', error);
      throw error;
    }
  }

  /**
   * Get default field mappings for WooCommerce to Vehicle
   */
  static getDefaultMappings(): ImportMappingConfig {
    return {
      'name': 'license_plate',
      'description': 'description',
      'price': 'daily_rate',
      'regular_price': 'daily_rate',
      'weight': 'weight',
      'sku': 'license_plate',
      'stock_status': 'status',
      'status': 'status',
      'make': 'make',
      'model': 'model',
      'year': 'year',
      'color': 'color',
      'fuel_type': 'fuel_type',
      'transmission': 'transmission',
      'seats': 'seats',
      'doors': 'doors',
      'engine_size': 'engine_size',
      'mileage': 'mileage',
    };
  }

  /**
   * Save integration configuration
   */
  static async saveIntegration(organizationId: string, config: WordPressConfig): Promise<Integration> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .insert({
          organization_id: organizationId,
          type: 'woocommerce',
          name: 'WooCommerce Integration',
          config: {
            url: config.url,
            consumerKey: config.consumerKey,
            consumerSecret: config.consumerSecret,
            version: config.version || 'v3',
          },
          is_active: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving WooCommerce integration:', error);
      throw error;
    }
  }

  /**
   * Get integration configuration
   */
  static async getIntegration(organizationId: string): Promise<Integration | null> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('type', 'woocommerce')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting WooCommerce integration:', error);
      throw error;
    }
  }

  /**
   * Update integration configuration
   */
  static async updateIntegration(integrationId: string, config: Partial<WordPressConfig>): Promise<Integration> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .update({
          config: {
            url: config.url,
            consumerKey: config.consumerKey,
            consumerSecret: config.consumerSecret,
            version: config.version || 'v3',
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', integrationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating WooCommerce integration:', error);
      throw error;
    }
  }

  /**
   * Delete integration
   */
  static async deleteIntegration(integrationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('integrations')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integrationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting WooCommerce integration:', error);
      throw error;
    }
  }

  /**
   * Get import jobs history
   */
  static async getImportJobs(organizationId: string): Promise<ImportJob[]> {
    try {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('integration_type', 'woocommerce')
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting import jobs:', error);
      throw error;
    }
  }

  /**
   * Save import mapping configuration
   */
  static async saveImportMapping(organizationId: string, mapping: ImportMappingConfig): Promise<ImportMapping> {
    try {
      const { data, error } = await supabase
        .from('import_mappings')
        .insert({
          organization_id: organizationId,
          integration_type: 'woocommerce',
          mapping_config: mapping,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving import mapping:', error);
      throw error;
    }
  }

  /**
   * Get import mapping configuration
   */
  static async getImportMapping(organizationId: string): Promise<ImportMapping | null> {
    try {
      const { data, error } = await supabase
        .from('import_mappings')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('integration_type', 'woocommerce')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting import mapping:', error);
      throw error;
    }
  }

  /**
   * Validate WooCommerce configuration
   */
  static validateConfig(config: WordPressConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.url) {
      errors.push('WordPress URL is required');
    } else if (!config.url.startsWith('http')) {
      errors.push('WordPress URL must start with http:// or https://');
    }

    if (!config.consumerKey) {
      errors.push('Consumer Key is required');
    }

    if (!config.consumerSecret) {
      errors.push('Consumer Secret is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sync specific products from WooCommerce
   */
  static async syncSpecificProducts(
    organizationId: string,
    config: WordPressConfig,
    productIds: number[],
    mapping: ImportMappingConfig,
    options: {
      updateExisting?: boolean;
      branchId?: string;
    } = {}
  ): Promise<ImportResult> {
    try {
      const result: ImportResult = {
        success: true,
        imported: 0,
        skipped: 0,
        errors: [],
        importedVehicles: [],
      };

      for (const productId of productIds) {
        try {
          // Fetch specific product
          const response = await fetch(
            `${config.url}/wp-json/wc/v3/products/${productId}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Basic ${btoa(`${config.consumerKey}:${config.consumerSecret}`)}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) {
            result.errors.push(`Failed to fetch product ${productId}: HTTP ${response.status}`);
            continue;
          }

          const product = await response.json();
          const vehicleData = this.mapProductToVehicle(product, mapping);

          // Create or update vehicle
          if (options.updateExisting) {
            const { data: existingVehicle } = await supabase
              .from('vehicles')
              .select('id')
              .eq('organization_id', organizationId)
              .eq('license_plate', vehicleData.license_plate)
              .single();

            if (existingVehicle) {
              const { data: updatedVehicle, error: updateError } = await supabase
                .from('vehicles')
                .update({
                  ...vehicleData,
                  organization_id: organizationId,
                  branch_id: options.branchId || null,
                  updated_at: new Date().toISOString(),
                })
                .eq('weather', existingVehicle.id)
                .select()
                .single();

              if (updateError) throw updateError;
              result.importedVehicles.push(updatedVehicle);
            } else {
              const { data: newVehicle, error: createError } = await supabase
                .from('vehicles')
                .insert({
                  ...vehicleData,
                  organization_id: organizationId,
                  branch_id: options.branchId || null,
                  status: 'active',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select()
                .single();

              if (createError) throw createError;
              result.importedVehicles.push(newVehicle);
            }
          } else {
            const { data: newVehicle, error: createError } = await supabase
              .from('vehicles')
              .insert({
                ...vehicleData,
                organization_id: organizationId,
                branch_id: options.branchId || null,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (createError) throw createError;
            result.importedVehicles.push(newVehicle);
          }

          result.imported++;
        } catch (error) {
          result.errors.push(`Error syncing product ${productId}: ${error.message}`);
        }
      }

      return result;
    } catch (error) {
      console.error('Error syncing specific products:', error);
      throw error;
    }
  }
}
