import { FastifyInstance } from 'fastify';
import { chatObservabilityController } from '../controllers/chat_observability.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export async function chatObservabilityRoutes(app: FastifyInstance) {
  app.get('/turns', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, chatObservabilityController.getTurns);
  app.get('/turns/:threadId', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, chatObservabilityController.getTurnsByThread);
  app.get('/tool-calls/:threadId', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, chatObservabilityController.getToolCalls);
  app.get('/tool-stats', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, chatObservabilityController.getToolCallStats);
}
