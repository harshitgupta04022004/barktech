import mongoose from 'mongoose';
import {
  AnalyticsEvent,
  IAnalyticsEvent,
  AnalyticsEventType,
} from '../models/analyticsEvent.js';

export class AnalyticsRepository {
  async create(data: Partial<IAnalyticsEvent>): Promise<IAnalyticsEvent> {
    return AnalyticsEvent.create(data);
  }

  async findByEvent(
    eventType: AnalyticsEventType,
    options: { page?: number; limit?: number; startDate?: Date; endDate?: Date } = {}
  ): Promise<{ events: IAnalyticsEvent[]; total: number }> {
    const { page = 1, limit = 50, startDate, endDate } = options;
    const query: Record<string, any> = { eventType };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const [events, total] = await Promise.all([
      AnalyticsEvent.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      AnalyticsEvent.countDocuments(query),
    ]);

    return { events, total };
  }

  async getPageViews(startDate?: Date, endDate?: Date): Promise<number> {
    return this.countByEvent('page_view', startDate, endDate);
  }

  async getProductViews(startDate?: Date, endDate?: Date): Promise<number> {
    return this.countByEvent('product_view', startDate, endDate);
  }

  async getSearchCount(startDate?: Date, endDate?: Date): Promise<number> {
    return this.countByEvent('search', startDate, endDate);
  }

  async countByEvent(
    eventType: AnalyticsEventType,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const query: Record<string, any> = { eventType };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }
    return AnalyticsEvent.countDocuments(query);
  }

  async getTopProducts(limit = 10, startDate?: Date, endDate?: Date) {
    const match: Record<string, any> = {
      eventType: 'product_view',
    };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    return AnalyticsEvent.aggregate([
      { $match: match },
      {
        $addFields: {
          prodId: { $ifNull: ['$extraData.productId', null] },
        },
      },
      { $match: { prodId: { $ne: null } } },
      {
        $group: {
          _id: '$prodId',
          views: { $sum: 1 },
        },
      },
      { $sort: { views: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 1,
          views: 1,
          productName: '$product.name',
          productSlug: '$product.slug',
        },
      },
    ]);
  }

  async getDailyPageViews(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: 'page_view',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getConversionFunnel(startDate?: Date, endDate?: Date) {
    const match: Record<string, any> = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    return AnalyticsEvent.aggregate([
      ...(Object.keys(match).length ? [{ $match: match }] : []),
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  async getUniqueVisitors(startDate?: Date, endDate?: Date): Promise<number> {
    const match: Record<string, any> = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    const result = await AnalyticsEvent.aggregate([
      ...(Object.keys(match).length ? [{ $match: match }] : []),
      {
        $group: {
          _id: '$ipAddress',
        },
      },
      { $count: 'total' },
    ]);

    return result[0]?.total || 0;
  }
}

export const analyticsRepository = new AnalyticsRepository();
