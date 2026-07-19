import { FastifyInstance } from 'fastify';
import { leadController } from '../controllers/lead.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export async function leadRoutes(app: FastifyInstance) {
  // Public - create inquiry
  app.post('/', leadController.create);

  // Admin
  app.get('/', { preHandler: [authenticate] }, leadController.list);
  app.get('/stats', { preHandler: [authenticate] }, leadController.stats);
  app.get('/:id', { preHandler: [authenticate] }, leadController.getById);
  app.put('/:id', { preHandler: [authenticate, requireRole('super_admin', 'admin', 'sales')] }, leadController.update);
}
