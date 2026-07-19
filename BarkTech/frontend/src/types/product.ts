import type { PaginationParams } from './api';

export interface ProductSpec {
  key: string;
  value: string;
}

export interface ProductMedia {
  type: 'image' | 'video' | 'document';
  url: string;
  alt?: string;
  sortOrder: number;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  category?: Category;
  specs: ProductSpec[];
  media: ProductMedia[];
  datasheetUrl?: string;
  price?: number;
  priceUnit?: string;
  moq?: number;
  leadTimeDays?: number;
  isActive: boolean;
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters extends PaginationParams {
  category?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface CreateProductRequest {
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  specs?: ProductSpec[];
  media?: ProductMedia[];
  datasheetUrl?: string;
  price?: number;
  priceUnit?: string;
  moq?: number;
  leadTimeDays?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;
