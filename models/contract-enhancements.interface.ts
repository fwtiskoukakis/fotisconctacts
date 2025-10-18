import { Contract } from './contract.interface';

export interface ContractCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  usageCount: number;
  createdAt: Date;
}

export interface ContractComment {
  id: string;
  contractId: string;
  userId: string;
  userName: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractAttachment {
  id: string;
  contractId: string;
  fileName: string;
  fileType: 'photo' | 'document' | 'other';
  fileSize: number;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
}

export interface ContractReminder {
  id: string;
  contractId: string;
  type: 'pickup' | 'return' | 'payment' | 'custom';
  title: string;
  message: string;
  scheduledDate: Date;
  isActive: boolean;
  isSent: boolean;
  createdAt: Date;
}

export interface EnhancedContract extends Contract {
  categoryId?: string;
  category?: ContractCategory;
  tags: ContractTag[];
  comments: ContractComment[];
  attachments: ContractAttachment[];
  reminders: ContractReminder[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  internalNotes?: string;
}

export interface ContractFilter {
  categories?: string[];
  tags?: string[];
  priority?: string[];
  status?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasComments?: boolean;
  hasAttachments?: boolean;
  hasReminders?: boolean;
}
