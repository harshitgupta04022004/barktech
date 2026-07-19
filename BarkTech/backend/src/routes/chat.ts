import { FastifyInstance } from 'fastify';
import { chatController } from '../controllers/chat.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export async function chatRoutes(app: FastifyInstance) {
  // Client chat — public (no auth required)
  app.post('/client/chat', chatController.clientChat);

  // Admin chat — requires auth
  app.post('/admin/chat', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, chatController.adminChat);

  // Session listing — admin only
  app.get('/sessions', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, chatController.listSessions);
  app.get('/sessions/:id', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, chatController.getSession);
}
