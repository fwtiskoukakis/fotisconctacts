/**
 * AADE Digital Client API Types
 */

export type AADEEnvironment = 'production' | 'development';

export type ClientServiceType = 1 | 2 | 3; // 1=Rental, 2=Parking/Wash, 3=Garage

export type InvoiceKind = 1 | 2; // 1=Receipt, 2=Invoice

export type AADEStatusCode = 
  | 'Success' 
  | 'XMLSyntaxError' 
  | 'ValidationError'
  | 'TechnicalError';

/**
 * AADE API Configuration
 */
export interface AADEConfig {
  userId: string;
  subscriptionKey: string;
  environment: AADEEnvironment;
  entityVatNumber: string; // Company's VAT number (ΑΦΜ)
}

/**
 * New Digital Client Request
 */
export interface NewDigitalClientDoc {
  clientServiceType: ClientServiceType;
  branch?: number;
  entityVatNumber: string;
  customerVatNumber: string;
  comments?: string;
  rentalDetails?: RentalDetails;
}

/**
 * Rental Details for Service Type 1
 */
export interface RentalDetails {
  vehiclePlateNumber: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  startDateTime: string; // ISO 8601 UTC
  estimatedEndDateTime?: string; // ISO 8601 UTC
  startKm?: number;
  estimatedTotalAmount?: number;
}

/**
 * Update Client Request
 */
export interface UpdateClientRequest {
  initialDclId: number;
  clientServiceType: ClientServiceType;
  amount?: number;
  completionDateTime?: string; // ISO 8601 UTC
  invoiceKind?: InvoiceKind;
  comments?: string;
  endKm?: number;
  actualEndDateTime?: string; // ISO 8601 UTC
}

/**
 * Cancel Client Parameters
 */
export interface CancelClientParams {
  dclId: number;
  entityVatNumber: string;
}

/**
 * Request Clients Parameters
 */
export interface RequestClientsParams {
  dclId?: number;
  maxDclId?: number;
  entityVatNumber: string;
  continuationToken?: string;
}

/**
 * Client Correlation Request
 */
export interface ClientCorrelationRequest {
  entityVatNumber: string;
  mark: string; // Invoice MARK
  correlatedDCLids: number[];
}

/**
 * AADE Response
 */
export interface AADEResponse {
  statusCode: AADEStatusCode;
  errors?: AADEError[];
  newClientDclID?: number;
  updatedClientDclID?: number;
  cancellationID?: number;
}

/**
 * AADE Error
 */
export interface AADEError {
  code: string;
  message: string;
}

/**
 * Requested Client Data
 */
export interface RequestedClientData {
  idDcl: number;
  clientServiceType: ClientServiceType;
  entityVatNumber: string;
  customerVatNumber: string;
  createdAt: string;
  updatedAt?: string;
  cancelledAt?: string;
  amount?: number;
  invoiceMark?: string;
}

/**
 * Request Clients Response
 */
export interface RequestClientsResponse {
  entityVatNumber: string;
  clientsDoc: RequestedClientData[];
  continuationToken?: string;
}

