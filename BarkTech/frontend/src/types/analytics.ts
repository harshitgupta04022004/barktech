export interface AnalyticsEvent {
  _id: string;
  event: string;
  category: string;
  label?: string;
  value?: number;
  page?: string;
  productId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardStats {
  totalPageViews: number;
  uniqueVisitors: number;
  totalProductViews: number;
  totalSearchQueries: number;
  topPages: Array<{ path: string; views: number }>;
  recentEvents: AnalyticsEvent[];
  period: {
    start: string;
    end: string;
  };
}

export interface TopProduct {
  productId: string;
  productName: string;
  productSlug: string;
  viewCount: number;
}

export interface ConversionFunnel {
  stages: Array<{
    name: string;
    count: number;
    conversionRate: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}

export interface PageView {
  _id: string;
  path: string;
  title?: string;
  referrer?: string;
  sessionId?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ProductView {
  _id: string;
  productId: string;
  productName: string;
  productSlug: string;
  referrer?: string;
  sessionId?: string;
  createdAt: string;
}

export interface SearchLog {
  _id: string;
  query: string;
  resultCount: number;
  selectedProductId?: string;
  sessionId?: string;
  createdAt: string;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
