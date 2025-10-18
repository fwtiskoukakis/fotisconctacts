import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import {
  AADEConfig,
  AADEEnvironment,
  NewDigitalClientDoc,
  UpdateClientRequest,
  CancelClientParams,
  RequestClientsParams,
  ClientCorrelationRequest,
  AADEResponse,
  RequestClientsResponse,
} from '../models/aade.types';

/**
 * AADE Digital Client API Service
 */
export class AADEService {
  private static readonly BASE_URLS = {
    production: 'https://mydatapi.aade.gr/DCL/',
    development: 'https://mydataapidev.aade.gr/DCL/',
  };

  private static config: AADEConfig | null = null;

  /**
   * Initialize AADE service with configuration
   */
  static initialize(config: AADEConfig): void {
    this.config = config;
  }

  /**
   * Get base URL based on environment
   */
  private static getBaseUrl(): string {
    if (!this.config) {
      throw new Error('AADE Service not initialized. Call initialize() first.');
    }
    return this.BASE_URLS[this.config.environment];
  }

  /**
   * Get request headers
   */
  private static getHeaders(userId?: string, subscriptionKey?: string): Record<string, string> {
    // Use provided credentials or fall back to config
    const userIdToUse = userId || this.config?.userId;
    const keyToUse = subscriptionKey || this.config?.subscriptionKey;

    if (!userIdToUse || !keyToUse) {
      throw new Error('AADE credentials not provided. Either initialize service or pass credentials.');
    }

    return {
      'aade-user-id': userIdToUse,
      'ocp-apim-subscription-key': keyToUse,
      'Content-Type': 'application/xml; charset=UTF-8',
    };
  }

  /**
   * Create a new digital client record
   */
  static async sendClient(
    params: NewDigitalClientDoc,
    userId?: string,
    subscriptionKey?: string
  ): Promise<AADEResponse> {
    try {
      const xml = this.buildSendClientXML(params);
      const url = `${this.getBaseUrl()}SendClient`;

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(userId, subscriptionKey),
        body: xml,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseXML = await response.text();
      return this.parseResponse(responseXML);
    } catch (error) {
      console.error('AADE SendClient error:', error);
      throw error;
    }
  }

  /**
   * Update an existing digital client record
   */
  static async updateClient(params: UpdateClientRequest): Promise<AADEResponse> {
    try {
      const xml = this.buildUpdateClientXML(params);
      const url = `${this.getBaseUrl()}UpdateClient`;

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: xml,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseXML = await response.text();
      return this.parseResponse(responseXML);
    } catch (error) {
      console.error('AADE UpdateClient error:', error);
      throw error;
    }
  }

  /**
   * Cancel a digital client record
   */
  static async cancelClient(params: CancelClientParams): Promise<AADEResponse> {
    try {
      const url = `${this.getBaseUrl()}CancelClient?DCLID=${params.dclId}&entityVatNumber=${params.entityVatNumber}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseXML = await response.text();
      return this.parseResponse(responseXML);
    } catch (error) {
      console.error('AADE CancelClient error:', error);
      throw error;
    }
  }

  /**
   * Retrieve client records
   */
  static async requestClients(params: RequestClientsParams): Promise<RequestClientsResponse> {
    try {
      const queryParams = new URLSearchParams({
        entityVatNumber: params.entityVatNumber,
      });

      if (params.dclId) {
        queryParams.append('DCLID', params.dclId.toString());
      }
      if (params.maxDclId) {
        queryParams.append('maxdclid', params.maxDclId.toString());
      }
      if (params.continuationToken) {
        queryParams.append('continuationToken', params.continuationToken);
      }

      const url = `${this.getBaseUrl()}RequestClients?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseXML = await response.text();
      return this.parseRequestClientsResponse(responseXML);
    } catch (error) {
      console.error('AADE RequestClients error:', error);
      throw error;
    }
  }

  /**
   * Correlate client records with invoices
   */
  static async clientCorrelations(params: ClientCorrelationRequest): Promise<AADEResponse> {
    try {
      const xml = this.buildClientCorrelationsXML(params);
      const url = `${this.getBaseUrl()}ClientCorrelations`;

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: xml,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseXML = await response.text();
      return this.parseResponse(responseXML);
    } catch (error) {
      console.error('AADE ClientCorrelations error:', error);
      throw error;
    }
  }

  /**
   * Build SendClient XML
   */
  private static buildSendClientXML(params: NewDigitalClientDoc): string {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
    });

    const obj: any = {
      NewDigitalClientDoc: {
        clientServiceType: params.clientServiceType,
        entityVatNumber: params.entityVatNumber,
        customerVatNumber: params.customerVatNumber,
      },
    };

    if (params.branch) {
      obj.NewDigitalClientDoc.branch = params.branch;
    }

    if (params.comments) {
      obj.NewDigitalClientDoc.comments = params.comments;
    }

    // Add rental details for service type 1
    if (params.clientServiceType === 1 && params.rentalDetails) {
      obj.NewDigitalClientDoc.RentalType = {
        vehiclePlateNumber: params.rentalDetails.vehiclePlateNumber,
        startDateTime: params.rentalDetails.startDateTime,
      };

      if (params.rentalDetails.vehicleBrand) {
        obj.NewDigitalClientDoc.RentalType.vehicleBrand = params.rentalDetails.vehicleBrand;
      }
      if (params.rentalDetails.vehicleModel) {
        obj.NewDigitalClientDoc.RentalType.vehicleModel = params.rentalDetails.vehicleModel;
      }
      if (params.rentalDetails.vehicleYear) {
        obj.NewDigitalClientDoc.RentalType.vehicleYear = params.rentalDetails.vehicleYear;
      }
      if (params.rentalDetails.estimatedEndDateTime) {
        obj.NewDigitalClientDoc.RentalType.estimatedEndDateTime = params.rentalDetails.estimatedEndDateTime;
      }
      if (params.rentalDetails.startKm) {
        obj.NewDigitalClientDoc.RentalType.startKm = params.rentalDetails.startKm;
      }
      if (params.rentalDetails.estimatedTotalAmount) {
        obj.NewDigitalClientDoc.RentalType.estimatedTotalAmount = params.rentalDetails.estimatedTotalAmount;
      }
    }

    return builder.build(obj);
  }

  /**
   * Build UpdateClient XML
   */
  private static buildUpdateClientXML(params: UpdateClientRequest): string {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
    });

    const obj: any = {
      updateClientType: {
        initialDclId: params.initialDclId,
        clientServiceType: params.clientServiceType,
      },
    };

    if (params.amount !== undefined) {
      obj.updateClientType.amount = params.amount;
    }
    if (params.completionDateTime) {
      obj.updateClientType.completionDateTime = params.completionDateTime;
    }
    if (params.invoiceKind) {
      obj.updateClientType.invoiceKind = params.invoiceKind;
    }
    if (params.comments) {
      obj.updateClientType.comments = params.comments;
    }
    if (params.endKm) {
      obj.updateClientType.endKm = params.endKm;
    }
    if (params.actualEndDateTime) {
      obj.updateClientType.actualEndDateTime = params.actualEndDateTime;
    }

    return builder.build(obj);
  }

  /**
   * Build ClientCorrelations XML
   */
  private static buildClientCorrelationsXML(params: ClientCorrelationRequest): string {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
    });

    const obj = {
      clientCorrelationType: {
        entityVatNumber: params.entityVatNumber,
        mark: params.mark,
        correlatedDCLids: params.correlatedDCLids.join(','),
      },
    };

    return builder.build(obj);
  }

  /**
   * Parse AADE response XML
   */
  private static parseResponse(xml: string): AADEResponse {
    const parser = new XMLParser({
      ignoreAttributes: false,
    });

    const result = parser.parse(xml);
    
    if (!result.ResponseDoc || !result.ResponseDoc.response) {
      throw new Error('Invalid AADE response format');
    }

    const response = result.ResponseDoc.response;

    return {
      statusCode: response.statusCode,
      newClientDclID: response.newClientDclID,
      updatedClientDclID: response.updatedClientDclID,
      cancellationID: response.cancellationID,
      errors: response.errors ? this.parseErrors(response.errors) : undefined,
    };
  }

  /**
   * Parse RequestClients response XML
   */
  private static parseRequestClientsResponse(xml: string): RequestClientsResponse {
    const parser = new XMLParser({
      ignoreAttributes: false,
    });

    const result = parser.parse(xml);

    if (!result.RequestedDoc) {
      throw new Error('Invalid AADE RequestClients response format');
    }

    const doc = result.RequestedDoc;

    return {
      entityVatNumber: doc.entityVatNumber,
      clientsDoc: Array.isArray(doc.clientsDoc) ? doc.clientsDoc : [doc.clientsDoc],
      continuationToken: doc.continuationToken,
    };
  }

  /**
   * Parse errors from response
   */
  private static parseErrors(errors: any): any[] {
    if (Array.isArray(errors)) {
      return errors;
    }
    return [errors];
  }

  /**
   * Format date to ISO 8601 UTC
   */
  static formatDateToUTC(date: Date): string {
    return date.toISOString();
  }

  /**
   * Validate VAT number (basic check)
   */
  static isValidVatNumber(vat: string): boolean {
    return /^\d{9}$/.test(vat);
  }
}

