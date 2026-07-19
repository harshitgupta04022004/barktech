import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  CaseStudy,
  NewsArticle,
  BlogPost,
  FAQ,
  Office,
  Page,
  CMSFilters,
  CreateCaseStudyRequest,
  UpdateCaseStudyRequest,
  CreateNewsRequest,
  UpdateNewsRequest,
  CreateBlogRequest,
  UpdateBlogRequest,
  CreateFAQRequest,
  UpdateFAQRequest,
  CreateOfficeRequest,
  UpdateOfficeRequest,
  CreatePageRequest,
  UpdatePageRequest,
} from '@/types/cms';

function toQueryParams(filters?: CMSFilters): Record<string, string | number | boolean | undefined> | undefined {
  if (!filters) return undefined;
  return {
    page: filters.page,
    limit: filters.limit,
    sort: filters.sort,
    order: filters.order,
    search: filters.search,
    status: filters.status,
    category: filters.category,
    startDate: filters.startDate,
    endDate: filters.endDate,
  };
}

export const cmsApi = {
  // ─── Case Studies ────────────────────────────────────────────
  getCaseStudies(filters?: CMSFilters): Promise<PaginatedResponse<CaseStudy>> {
    return apiClient.get<CaseStudy[]>('/cms/case-studies', toQueryParams(filters)) as Promise<PaginatedResponse<CaseStudy>>;
  },

  getCaseStudyById(id: string): Promise<ApiResponse<CaseStudy>> {
    return apiClient.get<CaseStudy>(`/cms/case-studies/${id}`);
  },

  getCaseStudyBySlug(slug: string): Promise<ApiResponse<CaseStudy>> {
    return apiClient.get<CaseStudy>(`/cms/case-studies/slug/${slug}`);
  },

  createCaseStudy(data: CreateCaseStudyRequest): Promise<ApiResponse<CaseStudy>> {
    return apiClient.post<CaseStudy>('/cms/case-studies', data);
  },

  updateCaseStudy(id: string, data: UpdateCaseStudyRequest): Promise<ApiResponse<CaseStudy>> {
    return apiClient.put<CaseStudy>(`/cms/case-studies/${id}`, data);
  },

  deleteCaseStudy(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`/cms/case-studies/${id}`);
  },

  publishCaseStudy(id: string): Promise<ApiResponse<CaseStudy>> {
    return apiClient.put<CaseStudy>(`/cms/case-studies/${id}`, { status: 'published' });
  },

  // ─── News ────────────────────────────────────────────────────
  getNews(filters?: CMSFilters): Promise<PaginatedResponse<NewsArticle>> {
    return apiClient.get<NewsArticle[]>('/cms/news', toQueryParams(filters)) as Promise<PaginatedResponse<NewsArticle>>;
  },

  getNewsById(id: string): Promise<ApiResponse<NewsArticle>> {
    return apiClient.get<NewsArticle>(`/cms/news/${id}`);
  },

  getNewsBySlug(slug: string): Promise<ApiResponse<NewsArticle>> {
    return apiClient.get<NewsArticle>(`/cms/news/slug/${slug}`);
  },

  createNews(data: CreateNewsRequest): Promise<ApiResponse<NewsArticle>> {
    return apiClient.post<NewsArticle>('/cms/news', data);
  },

  updateNews(id: string, data: UpdateNewsRequest): Promise<ApiResponse<NewsArticle>> {
    return apiClient.put<NewsArticle>(`/cms/news/${id}`, data);
  },

  deleteNews(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`/cms/news/${id}`);
  },

  publishNews(id: string): Promise<ApiResponse<NewsArticle>> {
    return apiClient.put<NewsArticle>(`/cms/news/${id}`, { status: 'published' });
  },

  // ─── Blog ────────────────────────────────────────────────────
  getBlog(filters?: CMSFilters): Promise<PaginatedResponse<BlogPost>> {
    return apiClient.get<BlogPost[]>('/cms/blog', toQueryParams(filters)) as Promise<PaginatedResponse<BlogPost>>;
  },

  getBlogById(id: string): Promise<ApiResponse<BlogPost>> {
    return apiClient.get<BlogPost>(`/cms/blog/${id}`);
  },

  getBlogBySlug(slug: string): Promise<ApiResponse<BlogPost>> {
    return apiClient.get<BlogPost>(`/cms/blog/slug/${slug}`);
  },

  createBlog(data: CreateBlogRequest): Promise<ApiResponse<BlogPost>> {
    return apiClient.post<BlogPost>('/cms/blog', data);
  },

  updateBlog(id: string, data: UpdateBlogRequest): Promise<ApiResponse<BlogPost>> {
    return apiClient.put<BlogPost>(`/cms/blog/${id}`, data);
  },

  deleteBlog(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`/cms/blog/${id}`);
  },

  publishBlog(id: string): Promise<ApiResponse<BlogPost>> {
    return apiClient.put<BlogPost>(`/cms/blog/${id}`, { status: 'published' });
  },

  // ─── FAQs ────────────────────────────────────────────────────
  getFAQs(filters?: CMSFilters): Promise<PaginatedResponse<FAQ>> {
    return apiClient.get<FAQ[]>('/cms/faqs', toQueryParams(filters)) as Promise<PaginatedResponse<FAQ>>;
  },

  getFAQById(id: string): Promise<ApiResponse<FAQ>> {
    return apiClient.get<FAQ>(`/cms/faqs/${id}`);
  },

  createFAQ(data: CreateFAQRequest): Promise<ApiResponse<FAQ>> {
    return apiClient.post<FAQ>('/cms/faqs', data);
  },

  updateFAQ(id: string, data: UpdateFAQRequest): Promise<ApiResponse<FAQ>> {
    return apiClient.put<FAQ>(`/cms/faqs/${id}`, data);
  },

  deleteFAQ(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`/cms/faqs/${id}`);
  },

  // ─── Offices ─────────────────────────────────────────────────
  getOffices(filters?: CMSFilters): Promise<PaginatedResponse<Office>> {
    return apiClient.get<Office[]>('/cms/offices', toQueryParams(filters)) as Promise<PaginatedResponse<Office>>;
  },

  getOfficeById(id: string): Promise<ApiResponse<Office>> {
    return apiClient.get<Office>(`/cms/offices/${id}`);
  },

  createOffice(data: CreateOfficeRequest): Promise<ApiResponse<Office>> {
    return apiClient.post<Office>('/cms/offices', data);
  },

  updateOffice(id: string, data: UpdateOfficeRequest): Promise<ApiResponse<Office>> {
    return apiClient.put<Office>(`/cms/offices/${id}`, data);
  },

  deleteOffice(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`/cms/offices/${id}`);
  },

  // ─── Pages ───────────────────────────────────────────────────
  getPages(filters?: CMSFilters): Promise<PaginatedResponse<Page>> {
    return apiClient.get<Page[]>('/cms/pages', toQueryParams(filters)) as Promise<PaginatedResponse<Page>>;
  },

  getPageById(id: string): Promise<ApiResponse<Page>> {
    return apiClient.get<Page>(`/cms/pages/${id}`);
  },

  getPageBySlug(slug: string): Promise<ApiResponse<Page>> {
    return apiClient.get<Page>(`/cms/pages/slug/${slug}`);
  },

  createPage(data: CreatePageRequest): Promise<ApiResponse<Page>> {
    return apiClient.post<Page>('/cms/pages', data);
  },

  updatePage(id: string, data: UpdatePageRequest): Promise<ApiResponse<Page>> {
    return apiClient.put<Page>(`/cms/pages/${id}`, data);
  },

  deletePage(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`/cms/pages/${id}`);
  },

  publishPage(id: string): Promise<ApiResponse<Page>> {
    return apiClient.put<Page>(`/cms/pages/${id}`, { status: 'published' });
  },
};
