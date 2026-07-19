import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  Product,
  Category,
  ProductFilters,
  CreateProductRequest,
  UpdateProductRequest,
} from '@/types/product';

function toQueryParams(filters?: ProductFilters): Record<string, string | number | boolean | undefined> | undefined {
  if (!filters) return undefined;
  return {
    page: filters.page,
    limit: filters.limit,
    sort: filters.sort,
    order: filters.order,
    search: filters.search,
    category: filters.category,
    isActive: filters.isActive,
    isFeatured: filters.isFeatured,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
  };
}

export const productsApi = {
  getProducts(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    return apiClient.get<Product[]>('/products', toQueryParams(filters)) as Promise<PaginatedResponse<Product>>;
  },

  getProductBySlug(slug: string): Promise<ApiResponse<Product>> {
    return apiClient.get<Product>(`/products/slug/${slug}`);
  },

  getProductById(id: string): Promise<ApiResponse<Product>> {
    return apiClient.get<Product>(`/products/${id}`);
  },

  createProduct(data: CreateProductRequest): Promise<ApiResponse<Product>> {
    return apiClient.post<Product>('/products', data);
  },

  updateProduct(id: string, data: UpdateProductRequest): Promise<ApiResponse<Product>> {
    return apiClient.put<Product>(`/products/${id}`, data);
  },

  deleteProduct(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`/products/${id}`);
  },

  getCategories(): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>('/products/categories/all');
  },

  getFeaturedProducts(): Promise<ApiResponse<Product[]>> {
    return apiClient.get<Product[]>('/products', { isFeatured: true, limit: 8 });
  },
};
