import { FastifyInstance } from 'fastify';
import { userController } from '../controllers/user.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export async function userRoutes(app: FastifyInstance) {
  // All user management endpoints require admin authentication
  app.get('/', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, userController.list);
  app.get('/:id', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, userController.getById);
  app.put('/:id', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, userController.update);
  app.put('/:id/role', { preHandler: [authenticate, requireRole('super_admin')] }, userController.updateRole);
  app.delete('/:id', { preHandler: [authenticate, requireRole('super_admin')] }, userController.deactivate);
}
