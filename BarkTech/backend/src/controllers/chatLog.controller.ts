import { FastifyRequest, FastifyReply } from 'fastify';
import { chatLogService } from '../services/chatLog.service.js';

export class ChatLogController {
  async listLogs(request: FastifyRequest, reply: FastifyReply) {
    const { source, userEmail, sessionId, startDate, endDate, page, limit } = request.query as any;
    const result = await chatLogService.getLogs({
      source, userEmail, sessionId, startDate, endDate,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
    return reply.send({ success: true, data: result.logs, meta: { total: result.total, page: page || 1, limit: limit || 50 } });
  }

  async getLog(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const log = await chatLogService.getLogById(id);
    if (!log) return reply.status(404).send({ error: 'Log not found' });
    return reply.send({ success: true, data: log });
  }

  async getStats(request: FastifyRequest, reply: FastifyReply) {
    const stats = await chatLogService.getStats();
    return reply.send({ success: true, data: stats });
  }
}

export const chatLogController = new ChatLogController();
