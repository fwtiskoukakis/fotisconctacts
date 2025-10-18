import { supabase } from '../utils/supabase';
import { 
  ContractCategory, 
  ContractTag, 
  ContractComment, 
  ContractAttachment, 
  ContractReminder,
  EnhancedContract,
  ContractFilter
} from '../models/contract-enhancements.interface';
import { Contract } from '../models/contract.interface';

export class ContractEnhancementService {
  // Categories
  static async getAllCategories(): Promise<ContractCategory[]> {
    try {
      const { data, error } = await supabase
        .from('contract_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  static async createCategory(category: Omit<ContractCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContractCategory> {
    try {
      const { data, error } = await supabase
        .from('contract_categories')
        .insert({
          ...category,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Tags
  static async getAllTags(): Promise<ContractTag[]> {
    try {
      const { data, error } = await supabase
        .from('contract_tags')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }

  static async createTag(tag: Omit<ContractTag, 'id' | 'createdAt' | 'usageCount'>): Promise<ContractTag> {
    try {
      const { data, error } = await supabase
        .from('contract_tags')
        .insert({
          ...tag,
          usage_count: 0,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }

  // Comments
  static async getContractComments(contractId: string): Promise<ContractComment[]> {
    try {
      const { data, error } = await supabase
        .from('contract_comments')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  static async addComment(comment: Omit<ContractComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContractComment> {
    try {
      const { data, error } = await supabase
        .from('contract_comments')
        .insert({
          ...comment,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Attachments
  static async getContractAttachments(contractId: string): Promise<ContractAttachment[]> {
    try {
      const { data, error } = await supabase
        .from('contract_attachments')
        .select('*')
        .eq('contract_id', contractId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching attachments:', error);
      throw error;
    }
  }

  static async addAttachment(attachment: Omit<ContractAttachment, 'id' | 'uploadedAt'>): Promise<ContractAttachment> {
    try {
      const { data, error } = await supabase
        .from('contract_attachments')
        .insert({
          ...attachment,
          uploaded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding attachment:', error);
      throw error;
    }
  }

  // Reminders
  static async getContractReminders(contractId: string): Promise<ContractReminder[]> {
    try {
      const { data, error } = await supabase
        .from('contract_reminders')
        .select('*')
        .eq('contract_id', contractId)
        .order('scheduled_date');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reminders:', error);
      throw error;
    }
  }

  static async createReminder(reminder: Omit<ContractReminder, 'id' | 'createdAt'>): Promise<ContractReminder> {
    try {
      const { data, error } = await supabase
        .from('contract_reminders')
        .insert({
          ...reminder,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  }

  // Enhanced Contract Operations
  static async getEnhancedContract(contractId: string): Promise<EnhancedContract | null> {
    try {
      // Get base contract
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;
      if (!contract) return null;

      // Get enhancements
      const [categories, tags, comments, attachments, reminders] = await Promise.all([
        this.getAllCategories(),
        this.getAllTags(),
        this.getContractComments(contractId),
        this.getContractAttachments(contractId),
        this.getContractReminders(contractId),
      ]);

      // Get contract's category and tags
      const contractCategory = categories.find(c => c.id === contract.category_id);
      const contractTags = tags.filter(t => contract.tags?.includes(t.id) || false);

      return {
        ...contract,
        category: contractCategory,
        tags: contractTags,
        comments,
        attachments,
        reminders,
        priority: contract.priority || 'medium',
        notes: contract.notes,
        internalNotes: contract.internal_notes,
      };
    } catch (error) {
      console.error('Error fetching enhanced contract:', error);
      return null;
    }
  }

  static async updateContractEnhancements(
    contractId: string, 
    updates: {
      categoryId?: string;
      tags?: string[];
      priority?: string;
      notes?: string;
      internalNotes?: string;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          category_id: updates.categoryId,
          tags: updates.tags,
          priority: updates.priority,
          notes: updates.notes,
          internal_notes: updates.internalNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contractId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating contract enhancements:', error);
      throw error;
    }
  }

  // Filtering
  static async getFilteredContracts(filter: ContractFilter): Promise<Contract[]> {
    try {
      let query = supabase.from('contracts').select('*');

      if (filter.categories && filter.categories.length > 0) {
        query = query.in('category_id', filter.categories);
      }

      if (filter.tags && filter.tags.length > 0) {
        query = query.overlaps('tags', filter.tags);
      }

      if (filter.priority && filter.priority.length > 0) {
        query = query.in('priority', filter.priority);
      }

      if (filter.status && filter.status.length > 0) {
        query = query.in('status', filter.status);
      }

      if (filter.dateRange) {
        query = query
          .gte('rental_period->pickupDate', filter.dateRange.start.toISOString())
          .lte('rental_period->pickupDate', filter.dateRange.end.toISOString());
      }

      if (filter.hasComments) {
        // This would require a more complex query with joins
        // For now, we'll implement this in the application layer
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error filtering contracts:', error);
      throw error;
    }
  }

  // Default categories
  static getDefaultCategories(): ContractCategory[] {
    return [
      {
        id: 'standard',
        name: 'Standard Rental',
        description: 'Regular car rental contracts',
        color: '#3B82F6',
        icon: '🚗',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'luxury',
        name: 'Luxury Rental',
        description: 'Premium and luxury vehicle rentals',
        color: '#F59E0B',
        icon: '✨',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'commercial',
        name: 'Commercial Rental',
        description: 'Business and commercial vehicle rentals',
        color: '#10B981',
        icon: '🚛',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'long-term',
        name: 'Long-term Rental',
        description: 'Extended rental periods',
        color: '#8B5CF6',
        icon: '📅',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'emergency',
        name: 'Emergency Rental',
        description: 'Urgent or emergency vehicle needs',
        color: '#EF4444',
        icon: '🚨',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  // Default tags
  static getDefaultTags(): ContractTag[] {
    return [
      {
        id: 'new-customer',
        name: 'Νέος Πελάτης',
        color: '#3B82F6',
        description: 'First-time customer',
        usageCount: 0,
        createdAt: new Date(),
      },
      {
        id: 'vip',
        name: 'VIP',
        color: '#F59E0B',
        description: 'VIP customer',
        usageCount: 0,
        createdAt: new Date(),
      },
      {
        id: 'corporate',
        name: 'Εταιρικός',
        color: '#10B981',
        description: 'Corporate client',
        usageCount: 0,
        createdAt: new Date(),
      },
      {
        id: 'weekend',
        name: 'Σαββατοκύριακο',
        color: '#8B5CF6',
        description: 'Weekend rental',
        usageCount: 0,
        createdAt: new Date(),
      },
      {
        id: 'airport',
        name: 'Αεροδρόμιο',
        color: '#06B6D4',
        description: 'Airport pickup/dropoff',
        usageCount: 0,
        createdAt: new Date(),
      },
    ];
  }
}
