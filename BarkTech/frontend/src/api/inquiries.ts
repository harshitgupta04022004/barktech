import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  Inquiry,
  InquiryFilters,
  CreateInquiryRequest,
  UpdateInquiryRequest,
  InquiryStats,
} from '@/types/inquiry';

function toQueryParams(filters?: InquiryFilters): Record<string, string | number | boolean | undefined> | undefined {
  if (!filters) return undefined;
  return {
    page: filters.page,
    limit: filters.limit,
    sort: filters.sort,
    order: filters.order,
    search: filters.search,
    status: filters.status,
    source: filters.source,
    priority: filters.priority,
  };
}

export const inquiriesApi = {
  getInquiries(filters?: InquiryFilters): Promise<PaginatedResponse<Inquiry>> {
    return apiClient.get<Inquiry[]>('/leads', toQueryParams(filters)) as Promise<PaginatedResponse<Inquiry>>;
  },

  getInquiryById(id: string): Promise<ApiResponse<Inquiry>> {
    return apiClient.get<Inquiry>(`/leads/${id}`);
  },

  createInquiry(data: CreateInquiryRequest): Promise<ApiResponse<Inquiry>> {
    return apiClient.post<Inquiry>('/leads', data);
  },

  updateInquiryStatus(
    id: string,
    data: UpdateInquiryRequest
  ): Promise<ApiResponse<Inquiry>> {
    return apiClient.put<Inquiry>(`/leads/${id}`, data);
  },

  getInquiryStats(): Promise<ApiResponse<InquiryStats>> {
    return apiClient.get<InquiryStats>('/leads/stats');
  },
};
