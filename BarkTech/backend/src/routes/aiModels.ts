import { FastifyInstance } from 'fastify';
import { aiModelController } from '../controllers/aiModel.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export async function aiModelRoutes(app: FastifyInstance) {
  const adminOpts = { preHandler: [authenticate, requireRole('super_admin', 'admin')] };

  // Public — get default model for a role (used by agent service)
  app.get('/default/:role', aiModelController.getDefault);

  // Admin — full CRUD
  app.get('/', adminOpts, aiModelController.list);
  app.get('/:id', adminOpts, aiModelController.getById);
  app.post('/', adminOpts, aiModelController.create);
  app.put('/:id', adminOpts, aiModelController.update);
  app.delete('/:id', adminOpts, aiModelController.delete);
  app.put('/:id/set-default', adminOpts, aiModelController.setDefault);
  app.put('/:id/toggle-active', adminOpts, aiModelController.toggleActive);
}
