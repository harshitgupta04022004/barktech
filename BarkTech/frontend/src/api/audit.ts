import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api';

export interface AuditLog {
  _id: string;
  userId: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditStats {
  totalActions: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
  topResources: Array<{ resource: string; count: number }>;
  recentActivity: AuditLog[];
}

export interface AuditFilters extends PaginationParams {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
}

function toQueryParams(filters?: AuditFilters): Record<string, string | number | boolean | undefined> | undefined {
  if (!filters) return undefined;
  return {
    page: filters.page,
    limit: filters.limit,
    sort: filters.sort,
    order: filters.order,
    search: filters.search,
    userId: filters.userId,
    action: filters.action,
    resource: filters.resource,
    startDate: filters.startDate,
    endDate: filters.endDate,
  };
}

export const auditApi = {
  getAuditLogs(filters?: AuditFilters): Promise<PaginatedResponse<AuditLog>> {
    return apiClient.get<AuditLog[]>('/audit/logs', toQueryParams(filters)) as Promise<PaginatedResponse<AuditLog>>;
  },

  getAuditStats(filters?: Pick<AuditFilters, 'startDate' | 'endDate'>): Promise<ApiResponse<AuditStats>> {
    return apiClient.get<AuditStats>('/audit/stats', toQueryParams(filters));
  },

  async exportLogs(filters?: AuditFilters): Promise<Blob | null> {
    const params = toQueryParams(filters);
    const url = params
      ? `/audit/export?${new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        )}`
      : '/audit/export';
    return apiClient.fetchBlob(url);
  },
};
