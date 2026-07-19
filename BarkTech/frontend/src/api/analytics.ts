import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  AnalyticsEvent,
  DashboardStats,
  TopProduct,
  ConversionFunnel,
  PageView,
  ProductView,
  SearchLog,
  AnalyticsFilters,
} from '@/types/analytics';

function toQueryParams(filters?: AnalyticsFilters): Record<string, string | number | boolean | undefined> | undefined {
  if (!filters) return undefined;
  return {
    page: filters.page,
    limit: filters.limit,
    startDate: filters.startDate,
    endDate: filters.endDate,
  };
}

export const analyticsApi = {
  trackEvent(data: {
    event: string;
    category: string;
    label?: string;
    value?: number;
    page?: string;
    productId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ApiResponse<AnalyticsEvent>> {
    return apiClient.post<AnalyticsEvent>('/analytics/events', data);
  },

  getPageViews(filters?: AnalyticsFilters): Promise<PaginatedResponse<PageView>> {
    return apiClient.get<PageView[]>('/analytics/page-views', toQueryParams(filters)) as Promise<PaginatedResponse<PageView>>;
  },

  getProductViews(filters?: AnalyticsFilters): Promise<PaginatedResponse<ProductView>> {
    return apiClient.get<ProductView[]>('/analytics/product-views', toQueryParams(filters)) as Promise<PaginatedResponse<ProductView>>;
  },

  getSearchLogs(filters?: AnalyticsFilters): Promise<PaginatedResponse<SearchLog>> {
    return apiClient.get<SearchLog[]>('/analytics/search-logs', toQueryParams(filters)) as Promise<PaginatedResponse<SearchLog>>;
  },

  getDashboard(filters?: AnalyticsFilters): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get<DashboardStats>('/analytics/dashboard', toQueryParams(filters));
  },

  getTopProducts(filters?: AnalyticsFilters): Promise<ApiResponse<TopProduct[]>> {
    return apiClient.get<TopProduct[]>('/analytics/top-products', toQueryParams(filters));
  },

  getFunnel(filters?: AnalyticsFilters): Promise<ApiResponse<ConversionFunnel>> {
    return apiClient.get<ConversionFunnel>('/analytics/funnel', toQueryParams(filters));
  },
};
