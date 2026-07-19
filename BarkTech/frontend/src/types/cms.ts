import type { PaginationParams } from './api';

export type PublishStatus = 'draft' | 'published' | 'archived';

export interface CaseStudy {
  _id: string;
  title: string;
  slug: string;
  clientName: string;
  industry?: string;
  summary: string;
  content: string;
  coverImage?: string;
  gallery?: string[];
  challenge?: string;
  solution?: string;
  results?: string;
  metrics?: Array<{ label: string; value: string }>;
  productId?: string;
  status: PublishStatus;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsArticle {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  author?: string;
  status: PublishStatus;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  author?: string;
  readTimeMinutes?: number;
  status: PublishStatus;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Office {
  _id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  address: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  _id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  status: PublishStatus;
  publishedAt?: string;
  sortOrder: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CMSFilters extends PaginationParams {
  status?: PublishStatus;
  category?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateCaseStudyRequest {
  title: string;
  slug?: string;
  clientName: string;
  industry?: string;
  summary: string;
  content: string;
  coverImage?: string;
  gallery?: string[];
  challenge?: string;
  solution?: string;
  results?: string;
  metrics?: Array<{ label: string; value: string }>;
  productId?: string;
  status?: PublishStatus;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder?: number;
}

export type UpdateCaseStudyRequest = Partial<CreateCaseStudyRequest>;

export interface CreateNewsRequest {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  author?: string;
  status?: PublishStatus;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder?: number;
}

export type UpdateNewsRequest = Partial<CreateNewsRequest>;

export interface CreateBlogRequest {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  author?: string;
  readTimeMinutes?: number;
  status?: PublishStatus;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder?: number;
}

export type UpdateBlogRequest = Partial<CreateBlogRequest>;

export interface CreateFAQRequest {
  question: string;
  answer: string;
  category?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateFAQRequest = Partial<CreateFAQRequest>;

export interface CreateOfficeRequest {
  name: string;
  city: string;
  state?: string;
  country: string;
  address: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateOfficeRequest = Partial<CreateOfficeRequest>;

export interface CreatePageRequest {
  title: string;
  slug?: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: PublishStatus;
  sortOrder?: number;
}

export type UpdatePageRequest = Partial<CreatePageRequest>;
