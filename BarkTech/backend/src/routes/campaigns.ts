import { FastifyInstance } from 'fastify';
import { campaignController } from '../controllers/campaign.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export async function campaignRoutes(app: FastifyInstance) {
  // All campaign routes require authentication
  app.addHook('preHandler', authenticate);

  app.get('/', { preHandler: [requireRole('super_admin', 'admin', 'sales')] }, campaignController.list);
  app.get('/stats', { preHandler: [requireRole('super_admin', 'admin')] }, campaignController.stats);
  app.get('/:id', { preHandler: [requireRole('super_admin', 'admin', 'sales')] }, campaignController.getById);
  app.post('/', { preHandler: [requireRole('super_admin', 'admin')] }, campaignController.create);
  app.put('/:id', { preHandler: [requireRole('super_admin', 'admin')] }, campaignController.update);
  app.delete('/:id', { preHandler: [requireRole('super_admin')] }, campaignController.delete);
  app.post('/:id/publish', { preHandler: [requireRole('super_admin', 'admin')] }, campaignController.publish);
}
