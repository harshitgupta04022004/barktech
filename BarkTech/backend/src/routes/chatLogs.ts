import { FastifyInstance } from 'fastify';
import { chatLogController } from '../controllers/chatLog.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export async function chatLogRoutes(app: FastifyInstance) {
  app.get('/logs', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, chatLogController.listLogs);
  app.get('/logs/:id', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, chatLogController.getLog);
  app.get('/stats', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, chatLogController.getStats);
}
