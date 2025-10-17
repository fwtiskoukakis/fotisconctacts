import { format } from 'date-fns';

/**
 * Creates a folder name based on renter name and rental dates
 * Example: Nikos_Papadopoulos_01-10-2025_to_08-10-2025
 */
export function formatFolderName(
  renterName: string,
  startDate: Date,
  endDate: Date
): string {
  const sanitizedName = renterName
    .replace(/[^a-zA-Z0-9\u0370-\u03FF\s]/g, '')
    .replace(/\s+/g, '_');
  
  // Ensure dates are valid
  const validStartDate = startDate instanceof Date && !isNaN(startDate.getTime()) ? startDate : new Date();
  const validEndDate = endDate instanceof Date && !isNaN(endDate.getTime()) ? endDate : new Date();
  
  const startDateStr = format(validStartDate, 'dd-MM-yyyy');
  const endDateStr = format(validEndDate, 'dd-MM-yyyy');
  
  return `${sanitizedName}_${startDateStr}_to_${endDateStr}`;
}

/**
 * Creates a contract filename with renter name and date
 * Example: Συμβολαιο_Nikos_Papadopoulos_01-10-2025_10-30
 */
export function formatContractFileName(
  renterName: string,
  date: Date
): string {
  const sanitizedName = renterName
    .replace(/[^a-zA-Z0-9\u0370-\u03FF\s]/g, '')
    .replace(/\s+/g, '_');
  
  // Ensure date is valid
  const validDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
  const dateStr = format(validDate, 'dd-MM-yyyy_HH-mm');
  
  return `Συμβολαιο_${sanitizedName}_${dateStr}`;
}

/**
 * Sanitizes a filename by removing invalid characters
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9\u0370-\u03FF._-]/g, '_')
    .replace(/_{2,}/g, '_');
}

