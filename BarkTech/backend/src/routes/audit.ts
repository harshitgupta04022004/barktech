import { FastifyInstance } from 'fastify';
import { auditController } from '../controllers/audit.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export async function auditRoutes(app: FastifyInstance) {
  // All audit endpoints require super_admin authentication
  app.get('/', { preHandler: [authenticate, requireRole('super_admin')] }, auditController.list);
  app.get('/stats', { preHandler: [authenticate, requireRole('super_admin')] }, auditController.stats);
  app.get('/export', { preHandler: [authenticate, requireRole('super_admin')] }, auditController.export);
}
