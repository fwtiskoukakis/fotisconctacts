export interface DamageTemplate {
  id: string;
  name: string;
  description: string;
  damageType: 'scratch' | 'dent' | 'crack' | 'other';
  severity: 'minor' | 'moderate' | 'severe';
  location: string;
  description: string;
  estimatedCost: number;
  category: string; // e.g., "Exterior", "Interior", "Mechanical"
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DamageReport {
  id: string;
  contractId: string;
  carId: string;
  damageType: 'scratch' | 'dent' | 'crack' | 'other';
  severity: 'minor' | 'moderate' | 'severe';
  location: string;
  description: string;
  estimatedCost: number;
  photos: string[];
  reportedBy: string;
  reportedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  templateId?: string; // Reference to template used
}

export class DamageTemplateService {
  private static readonly STORAGE_KEY = 'damage_templates';

  /**
   * Get all damage templates
   */
  static async getAllTemplates(): Promise<DamageTemplate[]> {
    try {
      // For now, return default templates
      // In a real app, this would fetch from Supabase
      return this.getDefaultTemplates();
    } catch (error) {
      console.error('Error fetching damage templates:', error);
      return this.getDefaultTemplates();
    }
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(id: string): Promise<DamageTemplate | null> {
    try {
      const templates = await this.getAllTemplates();
      return templates.find(t => t.id === id) || null;
    } catch (error) {
      console.error('Error fetching damage template by ID:', error);
      return null;
    }
  }

  /**
   * Create new template
   */
  static async createTemplate(template: Omit<DamageTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<DamageTemplate> {
    try {
      const newTemplate: DamageTemplate = {
        ...template,
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // TODO: Save to Supabase
      // For now, just return the template
      return newTemplate;
    } catch (error) {
      console.error('Error creating damage template:', error);
      throw error;
    }
  }

  /**
   * Apply template to damage report
   */
  static applyTemplate(template: DamageTemplate, customizations?: Partial<DamageReport>): Partial<DamageReport> {
    return {
      damageType: template.damageType,
      severity: template.severity,
      location: template.location,
      description: template.description,
      estimatedCost: template.estimatedCost,
      templateId: template.id,
      ...customizations, // Allow customizations to override template values
    };
  }

  /**
   * Get default templates
   */
  private static getDefaultTemplates(): DamageTemplate[] {
    return [
      {
        id: 'default_scratch_minor',
        name: 'Μικρή Γρατζουνιά',
        description: 'Μικρή γρατζουνιά στο εξωτερικό',
        damageType: 'scratch',
        severity: 'minor',
        location: 'Εξωτερικό',
        description: 'Μικρή γρατζουνιά που μπορεί να διορθωθεί με πολικό.',
        estimatedCost: 50,
        category: 'Exterior',
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'default_dent_moderate',
        name: 'Σκάσιμο Μέτριο',
        description: 'Μέτριο σκάσιμο στο αμάξι',
        damageType: 'dent',
        severity: 'moderate',
        location: 'Εξωτερικό',
        description: 'Σκάσιμο που απαιτεί επαγγελματική επισκευή.',
        estimatedCost: 200,
        category: 'Exterior',
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'default_crack_severe',
        name: 'Ρωγμή Σοβαρή',
        description: 'Σοβαρή ρωγμή στο παρμπρίζ',
        damageType: 'crack',
        severity: 'severe',
        location: 'Παρμπρίζ',
        description: 'Σοβαρή ρωγμή που απαιτεί αντικατάσταση παρμπρίζ.',
        estimatedCost: 300,
        category: 'Exterior',
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'default_interior_damage',
        name: 'Ζημιά Εσωτερικού',
        description: 'Ζημιά στο εσωτερικό του οχήματος',
        damageType: 'other',
        severity: 'minor',
        location: 'Εσωτερικό',
        description: 'Μικρή ζημιά στο εσωτερικό που μπορεί να καθαριστεί.',
        estimatedCost: 30,
        category: 'Interior',
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'default_mechanical_issue',
        name: 'Μηχανικό Πρόβλημα',
        description: 'Μηχανικό πρόβλημα στο όχημα',
        damageType: 'other',
        severity: 'severe',
        location: 'Μηχανή',
        description: 'Μηχανικό πρόβλημα που απαιτεί επισκευή.',
        estimatedCost: 500,
        category: 'Mechanical',
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  /**
   * Get templates by category
   */
  static async getTemplatesByCategory(category: string): Promise<DamageTemplate[]> {
    try {
      const templates = await this.getAllTemplates();
      return templates.filter(t => t.category === category);
    } catch (error) {
      console.error('Error fetching templates by category:', error);
      return [];
    }
  }

  /**
   * Search templates
   */
  static async searchTemplates(query: string): Promise<DamageTemplate[]> {
    try {
      const templates = await this.getAllTemplates();
      const lowercaseQuery = query.toLowerCase();
      
      return templates.filter(template => 
        template.name.toLowerCase().includes(lowercaseQuery) ||
        template.description.toLowerCase().includes(lowercaseQuery) ||
        template.location.toLowerCase().includes(lowercaseQuery) ||
        template.category.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Error searching templates:', error);
      return [];
    }
  }
}
