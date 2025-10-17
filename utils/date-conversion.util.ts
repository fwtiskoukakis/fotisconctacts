import { Contract } from '../models/contract.interface';

/**
 * Converts date strings to Date objects in a contract
 */
export function convertContractDates(contract: Contract): Contract {
  return {
    ...contract,
    rentalPeriod: {
      ...contract.rentalPeriod,
      pickupDate: new Date(contract.rentalPeriod.pickupDate),
      dropoffDate: new Date(contract.rentalPeriod.dropoffDate),
    },
    createdAt: new Date(contract.createdAt),
  };
}

/**
 * Converts date strings to Date objects in an array of contracts
 */
export function convertContractsDates(contracts: Contract[]): Contract[] {
  return contracts.map(convertContractDates);
}

