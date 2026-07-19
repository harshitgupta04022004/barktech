import type { PaginationParams } from './api';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  description: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  amount?: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  inquiryId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  customerAddress?: string;
  customerGst?: string;
  shipToAddress?: string;
  modeOfDelivery?: string;
  dispatchFrom?: string;
  transportDetails?: string;
  deliveryBasis?: string;
  refAttendedBy?: string;
  currency: string;
  items: InvoiceItem[];
  subtotal: number;
  gstAmount: number;
  gstRate: number;
  total: number;
  amountInWords?: string;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  dueDate?: string;
  paidAt?: string;
  pdfUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceFilters extends PaginationParams {
  status?: InvoiceStatus;
  search?: string;
}

export interface CreateInvoiceRequest {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  customerAddress?: string;
  customerGst?: string;
  shipToAddress?: string;
  modeOfDelivery?: string;
  dispatchFrom?: string;
  refAttendedBy?: string;
  items: InvoiceItem[];
  gstRate?: number;
  currency?: string;
  status?: InvoiceStatus;
  dueDate?: string;
  notes?: string;
}

export type UpdateInvoiceRequest = Partial<CreateInvoiceRequest>;

export interface InvoiceStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
  totalRevenue: number;
  pendingAmount: number;
}
