export interface DamageCategory {
  id: string;
  name: string;
  color: string;
}

export const DAMAGE_CATEGORIES: DamageCategory[] = [
  { id: 'scratch', name: 'Γρατζουνιά', color: '#FFA500' },
  { id: 'dent', name: 'Βαθούλωμα', color: '#FF4500' },
  { id: 'crack', name: 'Ρωγμή', color: '#DC143C' },
  { id: 'missing', name: 'Λείπει μέρος', color: '#8B0000' },
];

