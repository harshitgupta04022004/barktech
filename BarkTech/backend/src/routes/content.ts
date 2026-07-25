import { FastifyInstance } from 'fastify';
import { contentController } from '../controllers/content.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export async function contentRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // Unified list across all content types
  app.get('/', { preHandler: [requireRole('super_admin', 'admin')] }, contentController.list);

  // Get single content item (searches across all collections)
  app.get('/:id', { preHandler: [requireRole('super_admin', 'admin')] }, contentController.getById);

  // Create content (body includes contentType discriminator)
  app.post('/', { preHandler: [requireRole('super_admin', 'admin')] }, contentController.create);

  // Update content
  app.put('/:id', { preHandler: [requireRole('super_admin', 'admin')] }, contentController.update);

  // Delete content
  app.delete('/:id', { preHandler: [requireRole('super_admin')] }, contentController.delete);

  // Review workflow
  app.patch('/:id/review', { preHandler: [requireRole('super_admin', 'admin')] }, contentController.review);
  app.post('/:id/approve', { preHandler: [requireRole('super_admin', 'admin')] }, contentController.approve);
  app.post('/:id/reject', { preHandler: [requireRole('super_admin', 'admin')] }, contentController.reject);

  // Publish to social platforms
  app.post('/:id/publish', { preHandler: [requireRole('super_admin', 'admin')] }, contentController.publish);
  app.get('/:id/publish-status', { preHandler: [requireRole('super_admin', 'admin')] }, contentController.publishStatus);
}
