import { analyticsRepository } from '../repositories/analytics.repository.js';

export class AnalyticsService {
  async trackEvent(data: {
    event: string;
    path?: string;
    productId?: string;
    userId?: string;
    metadata?: Record<string, string>;
    ip?: string;
    userAgent?: string;
  }) {
    return analyticsRepository.create({
      eventType: data.event as any,
      pageUrl: data.path,
      extraData: {
        productId: data.productId,
        userId: data.userId,
        metadata: data.metadata,
      },
      ipAddress: data.ip,
      userAgent: data.userAgent,
    });
  }

  async getPageViews(startDate?: Date, endDate?: Date) {
    const count = await analyticsRepository.getPageViews(startDate, endDate);
    const daily = await analyticsRepository.getDailyPageViews(30);
    return { count, daily };
  }

  async getProductViews(startDate?: Date, endDate?: Date) {
    return analyticsRepository.getProductViews(startDate, endDate);
  }

  async getSearchLogs(
    page = 1,
    limit = 50,
    startDate?: Date,
    endDate?: Date
  ) {
    return analyticsRepository.findByEvent('search', { page, limit, startDate, endDate });
  }

  async getDashboardStats(startDate?: Date, endDate?: Date) {
    const [pageViews, productViews, searchCount, uniqueVisitors, topProducts] =
      await Promise.all([
        analyticsRepository.getPageViews(startDate, endDate),
        analyticsRepository.getProductViews(startDate, endDate),
        analyticsRepository.getSearchCount(startDate, endDate),
        analyticsRepository.getUniqueVisitors(startDate, endDate),
        analyticsRepository.getTopProducts(10, startDate, endDate),
      ]);

    return {
      pageViews,
      productViews,
      searches: searchCount,
      uniqueVisitors,
      topProducts,
    };
  }

  async getTopProducts(limit = 10, startDate?: Date, endDate?: Date) {
    return analyticsRepository.getTopProducts(limit, startDate, endDate);
  }

  async getConversionFunnel(startDate?: Date, endDate?: Date) {
    return analyticsRepository.getConversionFunnel(startDate, endDate);
  }
}

export const analyticsService = new AnalyticsService();
