import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  Invoice,
  InvoiceFilters,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceStats,
} from '@/types/invoice';

function toQueryParams(filters?: InvoiceFilters): Record<string, string | number | boolean | undefined> | undefined {
  if (!filters) return undefined;
  return {
    page: filters.page,
    limit: filters.limit,
    sort: filters.sort,
    order: filters.order,
    search: filters.search,
    status: filters.status,
    startDate: filters.startDate,
    endDate: filters.endDate,
  };
}

export const invoicesApi = {
  getInvoices(filters?: InvoiceFilters): Promise<PaginatedResponse<Invoice>> {
    return apiClient.get<Invoice[]>('/invoices', toQueryParams(filters)) as Promise<PaginatedResponse<Invoice>>;
  },

  getInvoiceById(id: string): Promise<ApiResponse<Invoice>> {
    return apiClient.get<Invoice>(`/invoices/${id}`);
  },

  createInvoice(data: CreateInvoiceRequest): Promise<ApiResponse<Invoice>> {
    return apiClient.post<Invoice>('/invoices', data);
  },

  updateInvoice(id: string, data: UpdateInvoiceRequest): Promise<ApiResponse<Invoice>> {
    return apiClient.put<Invoice>(`/invoices/${id}`, data);
  },

  updateInvoiceStatus(
    id: string,
    status: Invoice['status']
  ): Promise<ApiResponse<Invoice>> {
    return apiClient.put<Invoice>(`/invoices/${id}`, { status });
  },

  getInvoiceStats(): Promise<ApiResponse<InvoiceStats>> {
    return apiClient.get<InvoiceStats>('/invoices/stats');
  },

  async downloadPdf(id: string): Promise<Blob | null> {
    return apiClient.fetchBlob(`/invoices/${id}/pdf`);
  },
};
