import { FastifyInstance } from 'fastify';
import { contentPostController } from '../controllers/contentPost.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export async function contentPostRoutes(app: FastifyInstance) {
  // Admin — CRUD
  app.get('/', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, contentPostController.list);
  app.get('/:id', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, contentPostController.getById);
  app.post('/', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, contentPostController.create);
  app.put('/:id', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, contentPostController.update);
  app.delete('/:id', { preHandler: [authenticate, requireRole('super_admin')] }, contentPostController.delete);

  // Review workflow
  app.patch('/:id/submit-review', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, contentPostController.submitForReview);
  app.patch('/:id/approve', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, contentPostController.approve);
  app.patch('/:id/reject', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, contentPostController.reject);
}
