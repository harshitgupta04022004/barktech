import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api';

export interface StockLevel {
  _id: string;
  productId: string;
  productName?: string;
  productSlug?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  unit: string;
  warehouse?: string;
  lastRestockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockLog {
  _id: string;
  productId: string;
  productName?: string;
  type: 'add' | 'deduct' | 'adjust' | 'reserve' | 'release';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  referenceId?: string;
  createdBy: string;
  createdAt: string;
}

export interface StockFilters extends PaginationParams {
  productId?: string;
  warehouse?: string;
  lowStock?: boolean;
}

export interface UpdateStockRequest {
  quantity: number;
  reason?: string;
}

export interface AddStockRequest {
  quantity: number;
  reason?: string;
}

export interface DeductStockRequest {
  quantity: number;
  reason?: string;
}

function toQueryParams(filters?: StockFilters): Record<string, string | number | boolean | undefined> | undefined {
  if (!filters) return undefined;
  return {
    page: filters.page,
    limit: filters.limit,
    sort: filters.sort,
    order: filters.order,
    search: filters.search,
    productId: filters.productId,
    warehouse: filters.warehouse,
    lowStock: filters.lowStock,
  };
}

export const stockApi = {
  getStockLevels(filters?: StockFilters): Promise<PaginatedResponse<StockLevel>> {
    return apiClient.get<StockLevel[]>('/stock', toQueryParams(filters)) as Promise<PaginatedResponse<StockLevel>>;
  },

  getStockByProduct(productId: string): Promise<ApiResponse<StockLevel>> {
    return apiClient.get<StockLevel>(`/stock/product/${productId}`);
  },

  updateStock(productId: string, data: UpdateStockRequest): Promise<ApiResponse<StockLevel>> {
    return apiClient.put<StockLevel>(`/stock/${productId}`, data);
  },

  addStock(productId: string, data: AddStockRequest): Promise<ApiResponse<StockLevel>> {
    return apiClient.post<StockLevel>(`/stock/${productId}/add`, data);
  },

  deductStock(productId: string, data: DeductStockRequest): Promise<ApiResponse<StockLevel>> {
    return apiClient.post<StockLevel>(`/stock/${productId}/deduct`, data);
  },

  getLowStock(filters?: PaginationParams): Promise<PaginatedResponse<StockLevel>> {
    return apiClient.get<StockLevel[]>('/stock/low-stock', toQueryParams({ ...filters, lowStock: true })) as Promise<PaginatedResponse<StockLevel>>;
  },

  getStockLogs(filters?: StockFilters): Promise<PaginatedResponse<StockLog>> {
    return apiClient.get<StockLog[]>('/stock/logs', toQueryParams(filters)) as Promise<PaginatedResponse<StockLog>>;
  },
};
