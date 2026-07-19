import { FastifyRequest, FastifyReply } from 'fastify';
import { auditService } from '../services/audit.service.js';

export class AuditController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, userId, action, resource, startDate, endDate } = request.query as any;
    const result = await auditService.getAuditLogs({
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      userId,
      action,
      resource,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return reply.send({
      success: true,
      data: result.logs,
      meta: {
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 50)),
      },
    });
  }

  async stats(request: FastifyRequest, reply: FastifyReply) {
    const stats = await auditService.getAuditStats();
    return reply.send({ success: true, data: stats });
  }

  async export(request: FastifyRequest, reply: FastifyReply) {
    const { userId, action, resource, startDate, endDate } = request.query as any;
    const logs = await auditService.exportLogs({
      userId,
      action,
      resource,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return reply.send({ success: true, data: logs });
  }
}

export const auditController = new AuditController();
