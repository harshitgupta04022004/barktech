import { FastifyInstance } from 'fastify';
import { productController } from '../controllers/product.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export async function productRoutes(app: FastifyInstance) {
  // Public — specific routes first to avoid /:id catching them
  app.get('/', productController.list);
  app.get('/categories/all', productController.listCategories);
  app.get('/slug/:slug', productController.getBySlug);
  app.get('/:id', productController.getById);

  // Admin — CRUD
  app.post('/', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, productController.create);
  app.put('/:id', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, productController.update);
  app.delete('/:id', { preHandler: [authenticate, requireRole('super_admin')] }, productController.delete);

  // Admin — Categories
  app.post('/categories', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, productController.createCategory);

  // Admin — Review workflow
  app.post('/:id/submit-review', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, productController.submitReview);
  app.post('/:id/approve', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, productController.approve);
  app.post('/:id/reject', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, productController.reject);

  // Admin — Publish/Unpublish
  app.post('/:id/publish', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, productController.publish);
  app.post('/:id/unpublish', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, productController.unpublish);

  // Admin — Specs
  app.post('/:id/specs', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, productController.addSpec);
  app.put('/:id/specs/:specId', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, productController.updateSpec);
  app.delete('/:id/specs/:specId', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, productController.deleteSpec);
}
