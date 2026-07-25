import { apiClient } from './client';
import type { ContentItem, ContentListResponse } from '@/types/content';

export const contentApi = {
  async list(params?: {
    type?: string;
    reviewStatus?: string;
    dateFrom?: string;
    dateTo?: string;
    productId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ContentListResponse> {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.reviewStatus) query.set('reviewStatus', params.reviewStatus);
    if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
    if (params?.dateTo) query.set('dateTo', params.dateTo);
    if (params?.productId) query.set('productId', params.productId);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const res = await apiClient.get<ContentListResponse>(`/api/v1/content?${query.toString()}`);
    return res.data ?? { success: false, data: [], total: 0 };
  },

  async getById(id: string): Promise<{ success: boolean; data: ContentItem; contentType: string }> {
    const res = await apiClient.get<{ success: boolean; data: ContentItem; contentType: string }>(`/api/v1/content/${id}`);
    return { success: res.success, data: res.data!.data, contentType: res.data!.contentType };
  },

  async create(data: Partial<ContentItem> & { contentType: string }): Promise<{ success: boolean; data: ContentItem }> {
    const res = await apiClient.post<{ success: boolean; data: ContentItem }>('/api/v1/content', data);
    return { success: res.success, data: res.data!.data };
  },

  async update(id: string, data: Partial<ContentItem>): Promise<{ success: boolean; data: ContentItem }> {
    const res = await apiClient.put<{ success: boolean; data: ContentItem }>(`/api/v1/content/${id}`, data);
    return { success: res.success, data: res.data!.data };
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/api/v1/content/${id}`);
    return { success: res.success, message: res.data?.message ?? '' };
  },

  async review(id: string, status: string, reason?: string): Promise<{ success: boolean; data: ContentItem }> {
    const res = await apiClient.patch<{ success: boolean; data: ContentItem }>(`/api/v1/content/${id}/review`, { status, reason });
    return { success: res.success, data: res.data!.data };
  },

  async approve(id: string, reviewNotes?: string): Promise<{ success: boolean; data: ContentItem }> {
    const res = await apiClient.post<{ success: boolean; data: ContentItem }>(`/api/v1/content/${id}/approve`, { reviewNotes });
    return { success: res.success, data: res.data!.data };
  },

  async reject(id: string, reason: string): Promise<{ success: boolean; data: ContentItem }> {
    const res = await apiClient.post<{ success: boolean; data: ContentItem }>(`/api/v1/content/${id}/reject`, { reason });
    return { success: res.success, data: res.data!.data };
  },
};
