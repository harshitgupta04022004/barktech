import { FastifyRequest, FastifyReply } from 'fastify';
import { analyticsService } from '../services/analytics.service.js';
import { z } from 'zod';

const trackEventSchema = z.object({
  event: z.string().min(1),
  path: z.string().optional(),
  productId: z.string().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

function parseDateRange(query: any): { startDate?: Date; endDate?: Date } {
  const startDate = query.startDate ? new Date(query.startDate as string) : undefined;
  const endDate = query.endDate ? new Date(query.endDate as string) : undefined;
  return { startDate, endDate };
}

export class AnalyticsController {
  async track(request: FastifyRequest, reply: FastifyReply) {
    const body = trackEventSchema.parse(request.body);
    const ip = request.ip;
    const userAgent = request.headers['user-agent'];

    const event = await analyticsService.trackEvent({
      ...body,
      ip,
      userAgent,
    });
    return reply.status(201).send({ success: true, data: event });
  }

  async pageViews(request: FastifyRequest, reply: FastifyReply) {
    const { startDate, endDate } = parseDateRange(request.query);
    const data = await analyticsService.getPageViews(startDate, endDate);
    return reply.send({ success: true, data });
  }

  async productViews(request: FastifyRequest, reply: FastifyReply) {
    const { startDate, endDate } = parseDateRange(request.query);
    const data = await analyticsService.getProductViews(startDate, endDate);
    return reply.send({ success: true, data });
  }

  async search(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, startDate, endDate } = request.query as any;
    const sd = startDate ? new Date(startDate) : undefined;
    const ed = endDate ? new Date(endDate) : undefined;
    const result = await analyticsService.getSearchLogs(
      Number(page) || 1,
      Number(limit) || 50,
      sd,
      ed
    );
    return reply.send({
      success: true,
      data: result.events,
      meta: {
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 50)),
      },
    });
  }

  async dashboard(request: FastifyRequest, reply: FastifyReply) {
    const { startDate, endDate } = parseDateRange(request.query);
    const data = await analyticsService.getDashboardStats(startDate, endDate);
    return reply.send({ success: true, data });
  }

  async topProducts(request: FastifyRequest, reply: FastifyReply) {
    const { limit, startDate, endDate } = request.query as any;
    const sd = startDate ? new Date(startDate) : undefined;
    const ed = endDate ? new Date(endDate) : undefined;
    const data = await analyticsService.getTopProducts(
      Number(limit) || 10,
      sd,
      ed
    );
    return reply.send({ success: true, data });
  }

  async funnel(request: FastifyRequest, reply: FastifyReply) {
    const { startDate, endDate } = parseDateRange(request.query);
    const data = await analyticsService.getConversionFunnel(startDate, endDate);
    return reply.send({ success: true, data });
  }
}

export const analyticsController = new AnalyticsController();
