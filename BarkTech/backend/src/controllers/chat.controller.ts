import { FastifyRequest, FastifyReply } from 'fastify';
import { chatService } from '../services/chat.service.js';
import { z } from 'zod';

const chatMessageSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
});

export class ChatController {
  async clientChat(request: FastifyRequest, reply: FastifyReply) {
    const { message, sessionId } = chatMessageSchema.parse(request.body);
    const user = (request as any).user;
    const result = await chatService.proxyToAgent({
      message,
      sessionId,
      source: 'client',
      userId: user?.sub,
    });
    return reply.send({ success: true, data: result });
  }

  async adminChat(request: FastifyRequest, reply: FastifyReply) {
    const { message, sessionId } = chatMessageSchema.parse(request.body);
    const user = (request as any).user;
    const result = await chatService.proxyToAgent({
      message,
      sessionId,
      source: 'admin',
      userId: user?.sub,
    });
    return reply.send({ success: true, data: result });
  }

  async listSessions(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, source, userId } = request.query as any;
    const result = await chatService.getSessions(
      Number(page) || 1,
      Number(limit) || 20,
      source,
      userId
    );
    return reply.send({
      success: true,
      data: result.sessions,
      meta: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 20)),
      },
    });
  }

  async getSession(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const session = await chatService.getSession(id);
    return reply.send({ success: true, data: session });
  }
}

export const chatController = new ChatController();
