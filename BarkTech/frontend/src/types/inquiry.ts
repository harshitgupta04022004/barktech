import type { PaginationParams } from './api';

export type InquiryStatus = 'new' | 'contacted' | 'qualified' | 'quoted' | 'won' | 'lost';

export type InquirySource = 'website' | 'ai_chat' | 'phone' | 'email' | 'referral' | 'other';

export type InquiryPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface InquiryItem {
  productId?: string;
  productName: string;
  quantity: number;
  unit?: string;
  notes?: string;
}

export interface Inquiry {
  _id: string;
  contactName: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string;
  source: InquirySource;
  status: InquiryStatus;
  priority: InquiryPriority;
  rfqItems: InquiryItem[];
  notes?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InquiryFilters extends PaginationParams {
  status?: InquiryStatus;
  source?: InquirySource;
  priority?: InquiryPriority;
}

export interface CreateInquiryRequest {
  contactName: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string;
  source?: InquirySource;
  rfqItems?: InquiryItem[];
  notes?: string;
}

export interface UpdateInquiryRequest {
  status?: InquiryStatus;
  priority?: InquiryPriority;
  assignedTo?: string;
  notes?: string;
}

export interface InquiryStats {
  total: number;
  newCount: number;
  contacted: number;
  qualified: number;
  quoted: number;
  won: number;
  lost: number;
  bySource: Record<InquirySource, number>;
}
