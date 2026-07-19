import { FastifyRequest, FastifyReply } from 'fastify';
import { chatObservabilityRepository } from '../repositories/chat_observability.repository.js';

export class ChatObservabilityController {
  async getTurns(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit } = request.query as any;
    const result = await chatObservabilityRepository.getAllTurns(Number(page) || 1, Number(limit) || 50);
    return reply.send({ success: true, data: result.turns, meta: { total: result.total } });
  }

  async getTurnsByThread(request: FastifyRequest, reply: FastifyReply) {
    const { threadId } = request.params as { threadId: string };
    const { page, limit } = request.query as any;
    const result = await chatObservabilityRepository.getTurns(threadId, Number(page) || 1, Number(limit) || 50);
    return reply.send({ success: true, data: result.turns, meta: { total: result.total } });
  }

  async getToolCalls(request: FastifyRequest, reply: FastifyReply) {
    const { threadId } = request.params as { threadId: string };
    const { page, limit } = request.query as any;
    const result = await chatObservabilityRepository.getToolCalls(threadId, Number(page) || 1, Number(limit) || 50);
    return reply.send({ success: true, data: result.calls, meta: { total: result.total } });
  }

  async getToolCallStats(request: FastifyRequest, reply: FastifyReply) {
    const stats = await chatObservabilityRepository.getToolCallStats();
    return reply.send({ success: true, data: stats });
  }
}

export const chatObservabilityController = new ChatObservabilityController();
