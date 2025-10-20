/**
 * TypeScript types for Multi-Tenant Business Management System
 * Based on the new database schema
 */

// ==============================================
// CORE ORGANIZATION TYPES
// ==============================================

export interface Organization {
  id: string;
  company_name: string;
  trading_name?: string;
  slug: string;
  vat_number: string;
  doy?: string;
  activity_code?: string;
  registration_number?: string;
  primary_address: string;
  city?: string;
  postal_code?: string;
  country: string;
  phone_primary: string;
  phone_secondary?: string;
  email_primary: string;
  email_support?: string;
  website?: string;
  logo_url?: string;
  icon_url?: string;
  brand_color_primary: string;
  brand_color_secondary: string;
  contract_header_image_url?: string;
  aade_user_id?: string;
  aade_subscription_key?: string;
  aade_enabled: boolean;
  aade_test_mode: boolean;
  business_type: 'small' | 'medium' | 'large';
  timezone: string;
  currency: string;
  language: string;
  max_users: number;
  max_vehicles: number;
  max_contracts_per_month: number;
  subscription_plan: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled';
  trial_ends_at?: string;
  subscription_starts_at?: string;
  subscription_ends_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  organization_id: string;
  name: string;
  address: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  id: string;
  organization_id: string;
  contract_prefix: string;
  contract_number_start: number;
  contract_template_id?: string;
  auto_send_contracts: boolean;
  email_notifications_enabled: boolean;
  email_from_name?: string;
  email_from_address?: string;
  email_signature?: string;
  sms_enabled: boolean;
  sms_provider?: string;
  sms_api_key?: string;
  default_currency: string;
  tax_rate: number;
  terms_and_conditions?: string;
  privacy_policy?: string;
  created_at: string;
  updated_at: string;
}

// ==============================================
// USER & TEAM MANAGEMENT
// ==============================================

export interface UserRole {
  role: 'owner' | 'admin' | 'manager' | 'agent' | 'viewer';
  permissions: {
    canManageUsers: boolean;
    canManageCars: boolean;
    canManageContracts: boolean;
    canManageCustomers: boolean;
    canViewReports: boolean;
    canManageSettings: boolean;
    canManageIntegrations: boolean;
    canManageExpenses: boolean;
  };
}

export interface TeamMember {
  id: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'manager' | 'agent' | 'viewer';
  branch_id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  organization?: Organization;
  branch?: Branch;
}

// ==============================================
// INTEGRATION TYPES
// ==============================================

export interface Integration {
  id: string;
  organization_id: string;
  integration_type: 'wordpress' | 'woocommerce' | 'wheelsys' | 'xml_feed' | 'api' | 'webhook';
  name: string;
  config: Record<string, any>;
  credentials?: Record<string, any>; // Encrypted
  is_active: boolean;
  last_sync_at?: string;
  sync_status: 'success' | 'failed' | 'pending' | 'in_progress';
  sync_error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ImportLog {
  id: string;
  organization_id: string;
  integration_id?: string;
  import_type: 'cars' | 'customers' | 'contracts';
  source: string;
  total_records: number;
  imported_records: number;
  failed_records: number;
  skipped_records: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_log?: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// ==============================================
// CUSTOMER MANAGEMENT
// ==============================================

export interface CustomerProfile {
  id: string;
  organization_id: string;
  full_name: string;
  id_number?: string;
  date_of_birth?: string;
  nationality: string;
  persistent_driver_license_number?: string;
  driver_license_expiry?: string;
  phone_primary?: string;
  phone_secondary?: string;
  email?: string;
  address?: string;
  company_name?: string;
  company_vat_number?: string;
  company_address?: string;
  customer_rating?: number;
  vip_status: boolean;
  blacklist_status: boolean;
  blacklist_reason?: string;
  total_spent: number;
  total_rentals: number;
  id_document_url?: string;
  license_document_url?: string;
  insurance_document_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CommunicationLog {
  id: string;
  organization_id: string;
  customer_id?: string;
  contract_id?: string;
  communication_type: 'email' | 'sms' | 'phone' | 'whatsapp' | 'viber';
  direction: 'inbound' | 'outbound';
  subject?: string;
  message: string;
  template_id?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  error_message?: string;
  sent_at?: string;
  read_at?: string;
  created_at: string;
}

// ==============================================
// VEHICLE MANAGEMENT
// ==============================================

export interface VehicleAccessory {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  category: 'safety' | 'comfort' | 'entertainment' | 'utility';
  daily_price: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleAccessoryAssignment {
  id: string;
  organization_id: string;
  car_id: string;
  accessory_id: string;
  assigned_at: string;
  unassigned_at?: string;
  is_active: boolean;
}

export interface MaintenanceRecord {
  id: string;
  organization_id: string;
  car_id: string;
  maintenance_type: 'routine' | 'repair' | 'inspection' | 'emergency';
  description: string;
  mileage?: number;
  cost?: number;
  service_provider?: string;
  service_provider_contact?: string;
  performed_at: string;
  next_due_date?: string;
  next_due_mileage?: number;
  receipt_url?: string;
  warranty_until?: string;
  created_at: string;
  updated_at: string;
}

// ==============================================
// FINANCIAL MANAGEMENT
// ==============================================

export interface ExpenseCategory {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  organization_id: string;
  category_id?: string;
  car_id?: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  receipt_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  category?: ExpenseCategory;
  car?: any; // Car interface
  created_by_user?: TeamMember;
}

// ==============================================
// NOTIFICATION SYSTEM
// ==============================================

export interface NotificationTemplate {
  id: string;
  organization_id: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  trigger_event: string;
  subject?: string;
  body: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ==============================================
// BUSINESS ONBOARDING TYPES
// ==============================================

export interface BusinessOnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  required: boolean;
  data?: Record<string, any>;
}

export interface BusinessOnboardingData {
  businessType: 'small' | 'medium' | 'large';
  businessDetails: {
    companyName: string;
    tradingName?: string;
    vatNumber: string;
    doy?: string;
    activityCode?: string;
    registrationNumber?: string;
  };
  contactLocation: {
    primaryAddress: string;
    city?: string;
    postalCode?: string;
    phonePrimary: string;
    phoneSecondary?: string;
    emailPrimary: string;
    emailSupport?: string;
    website?: string;
    branches: Array<{
      name: string;
      address: string;
      city?: string;
      postalCode?: string;
      phone?: string;
      email?: string;
    }>;
  };
  branding: {
    logoUrl?: string;
    iconUrl?: string;
    brandColorPrimary: string;
    brandColorSecondary: string;
    contractHeaderImageUrl?: string;
    termsAndConditions?: string;
  };
  aadeIntegration: {
    aadeUserId?: string;
    aadeSubscriptionKey?: string;
    enabled: boolean;
    testMode: boolean;
  };
  teamMembers: Array<{
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'manager' | 'agent' | 'viewer';
    phone?: string;
  }>;
  importData?: {
    source: 'wordpress' | 'woocommerce' | 'wheelsys' | 'xml' | 'csv';
    config: Record<string, any>;
  };
  subscription: {
    plan: 'free' | 'basic' | 'pro' | 'enterprise';
    paymentMethod?: string;
    billingAddress?: string;
  };
}

// ==============================================
// DASHBOARD & ANALYTICS
// ==============================================

export interface DashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeRentals: number;
  totalVehicles: number;
  availableVehicles: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
  averageRentalDuration: number;
  fleetUtilizationRate: number;
  topPerformingVehicles: Array<{
    id: string;
    makeModel: string;
    revenue: number;
    rentals: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'rental' | 'return' | 'maintenance' | 'new_customer';
    description: string;
    timestamp: string;
    amount?: number;
  }>;
}

export interface RevenueReport {
  period: string;
  totalRevenue: number;
  rentalRevenue: number;
  accessoryRevenue: number;
  otherRevenue: number;
  expenses: number;
  profit: number;
  byVehicle: Array<{
    vehicleId: string;
    makeModel: string;
    revenue: number;
    rentals: number;
  }>;
  byBranch: Array<{
    branchId: string;
    branchName: string;
    revenue: number;
  }>;
}

// ==============================================
// CALENDAR & AVAILABILITY
// ==============================================

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'rental' | 'maintenance' | 'blocked' | 'available';
  vehicleId?: string;
  contractId?: string;
  customerName?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  color: string;
  description?: string;
}

export interface VehicleAvailability {
  vehicleId: string;
  date: string;
  status: 'available' | 'rented' | 'maintenance' | 'blocked';
  contractId?: string;
  customerName?: string;
  pickupTime?: string;
  returnTime?: string;
}

// ==============================================
// EXPORT/IMPORT TYPES
// ==============================================

export interface ImportMapping {
  sourceField: string;
  targetField: string;
  transform?: 'uppercase' | 'lowercase' | 'trim' | 'date' | 'number';
  defaultValue?: any;
}

export interface ImportConfig {
  source: 'wordpress' | 'woocommerce' | 'wheelsys' | 'xml' | 'csv';
  url?: string;
  credentials?: Record<string, string>;
  mappings: ImportMapping[];
  options: {
    updateExisting: boolean;
    skipDuplicates: boolean;
    validateData: boolean;
  };
}

export interface ExportConfig {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  dataType: 'contracts' | 'customers' | 'vehicles' | 'expenses' | 'reports';
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
  fields?: string[];
}

// ==============================================
// API RESPONSE TYPES
// ==============================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  success: boolean;
}

// ==============================================
// FORM TYPES
// ==============================================

export interface OrganizationFormData {
  company_name: string;
  trading_name?: string;
  vat_number: string;
  doy?: string;
  activity_code?: string;
  registration_number?: string;
  primary_address: string;
  city?: string;
  postal_code?: string;
  phone_primary: string;
  phone_secondary?: string;
  email_primary: string;
  email_support?: string;
  website?: string;
  business_type: 'small' | 'medium' | 'large';
}

export interface BranchFormData {
  name: string;
  address: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  is_primary: boolean;
}

export interface CustomerFormData {
  full_name: string;
  id_number?: string;
  date_of_birth?: string;
  nationality: string;
  driver_license_number?: string;
  driver_license_expiry?: string;
  phone_primary?: string;
  phone_secondary?: string;
  email?: string;
  address?: string;
  company_name?: string;
  company_vat_number?: string;
  company_address?: string;
  notes?: string;
}

export interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  license_plate: string;
  category: 'car' | 'atv' | 'scooter' | 'motorcycle' | 'van' | 'truck';
  color?: string;
  vin?: string;
  mileage: number;
  fuel_level: number;
  insurance_type: 'basic' | 'full';
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  purchase_price?: number;
  purchase_date?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_expiry?: string;
  kteo_expiry?: string;
  road_tax_expiry?: string;
  branch_id?: string;
  status: 'available' | 'rented' | 'maintenance' | 'retired';
}

// ==============================================
// MISSING TYPES FOR SERVICES
// ==============================================

export interface Vehicle {
  id: string;
  organization_id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  category: 'car' | 'atv' | 'scooter' | 'motorcycle' | 'van' | 'truck';
  color?: string;
  vin?: string;
  mileage: number;
  fuel_level: number;
  insurance_type: 'basic' | 'full';
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  purchase_price?: number;
  purchase_date?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_expiry?: string;
  kteo_expiry?: string;
  road_tax_expiry?: string;
  branch_id?: string;
  status: 'available' | 'rented' | 'maintenance' | 'retired';
  created_at: string;
  updated_at: string;
  // Relations
  contracts?: Contract[];
  maintenance?: MaintenanceRecord[];
}

export interface Contract {
  id: string;
  organization_id: string;
  contract_number: string;
  customer_id: string;
  car_id: string;
  rental_start_date: string;
  rental_end_date: string;
  pickup_date: string;
  dropoff_date: string;
  total_cost: number;
  deposit_amount: number;
  status: 'draft' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Relations
  customer?: CustomerProfile;
  car?: Vehicle;
}

export interface Report {
  id: string;
  organization_id: string;
  title: string;
  type: 'contracts' | 'damage' | 'expenses' | 'revenue' | 'fleet' | 'customer' | 'financial';
  data: any;
  filters: ReportFilters;
  generated_at: string;
  created_at: string;
}

export interface ReportTemplate {
  id: string;
  organization_id: string;
  name: string;
  type: 'contracts' | 'damage' | 'expenses' | 'revenue' | 'fleet' | 'customer' | 'financial';
  template_config: any;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  organization_id: string;
  widget_type: string;
  title: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface KPI {
  id: string;
  organization_id: string;
  name: string;
  value: number;
  target?: number;
  unit: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  trend: 'up' | 'down' | 'stable';
  calculated_at: string;
}

export interface ImportJob {
  id: string;
  organization_id: string;
  integration_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  result?: {
    imported: number;
    skipped: number;
    errors: string[];
  };
  error?: string;
  created_at: string;
}

export interface ImportMapping {
  id: string;
  organization_id: string;
  integration_type: string;
  mapping_config: ImportMappingConfig;
  created_at: string;
  updated_at: string;
}

export interface ImportMappingConfig {
  sourceField: string;
  targetField: string;
  transform?: 'uppercase' | 'lowercase' | 'trim' | 'date' | 'number';
  defaultValue?: any;
}

export interface ReportFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  vehicleIds?: string[];
  customerIds?: string[];
  status?: string[];
  [key: string]: any;
}

export interface Revenue {
  id: string;
  organization_id: string;
  amount: number;
  source: string;
  payment_method: string;
  revenue_date: string;
  created_at: string;
}

export interface Expense {
  id: string;
  organization_id: string;
  category_id?: string;
  car_id?: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  approved: boolean;
  category?: ExpenseCategory;
  receipt_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Damage {
  id: string;
  organization_id: string;
  contract_id?: string;
  car_id: string;
  damage_location: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  repair_cost?: number;
  status: 'reported' | 'assessed' | 'repaired' | 'closed';
  photos?: string[];
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  vip_status: boolean;
  blacklist_status: boolean;
  contracts: Contract[];
  created_at: string;
  updated_at: string;
}

export interface FleetStats {
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  totalRevenue: number;
  averageUtilization: number;
  maintenanceAlerts: Array<{
    vehicleId: string;
    makeModel: string;
    alertType: 'service_due' | 'insurance_expiry' | 'kteo_expiry' | 'road_tax_expiry';
    dueDate: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export interface Colors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  systemRed: string;
  systemOrange: string;
  systemYellow: string;
  systemGreen: string;
  systemBlue: string;
  systemPurple: string;
  systemPink: string;
  systemTeal: string;
  systemIndigo: string;
  systemGray: string;
  systemGray2: string;
  systemGray3: string;
  systemGray4: string;
  systemGray5: string;
  systemGray6: string;
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderSecondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  cardBackground: string;
  modalBackground: string;
  overlay: string;
  shadow: string;
  accent: string;
  highlight: string;
  disabled: string;
  placeholder: string;
  link: string;
  destructive: string;
  constructive: string;
  neutral: string;
  pending: string;
  completed: string;
  cancelled: string;
  overdue: string;
  gray: string;
}

export interface FinancialTransaction {
  id: string;
  organization_id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  description: string;
  category: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  organization_id: string;
  contract_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialReport {
  id: string;
  organization_id: string;
  report_type: 'monthly' | 'quarterly' | 'yearly';
  period_start: string;
  period_end: string;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  organization_id: string;
  name: string;
  type: 'cash' | 'card' | 'bank_transfer' | 'check' | 'other';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaxRate {
  id: string;
  organization_id: string;
  name: string;
  rate: number;
  type: 'percentage' | 'fixed';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
