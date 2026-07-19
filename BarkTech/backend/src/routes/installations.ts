import { FastifyInstance } from 'fastify';
import { installationController } from '../controllers/installation.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export async function installationRoutes(app: FastifyInstance) {
  // Public — date range for calendar views
  app.get('/by-date', { preHandler: [authenticate] }, installationController.getByDateRange);

  // Admin — CRUD
  app.get('/', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, installationController.list);
  app.get('/client/:clientId', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, installationController.getByClient);
  app.get('/:id', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, installationController.getById);
  app.post('/', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, installationController.create);
  app.put('/:id', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, installationController.update);
  app.delete('/:id', { preHandler: [authenticate, requireRole('super_admin')] }, installationController.delete);

  // Status transitions
  app.patch('/:id/start', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, installationController.start);
  app.patch('/:id/complete', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, installationController.complete);
  app.patch('/:id/reschedule', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, installationController.reschedule);

  // Photos
  app.post('/:id/photos', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, installationController.addPhoto);
}
