import { FastifyInstance } from 'fastify';
import { stockController } from '../controllers/stock.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export async function stockRoutes(app: FastifyInstance) {
  // List stock records
  app.get('/', { preHandler: [authenticate] }, stockController.list);

  // Low stock alerts
  app.get('/low-stock', { preHandler: [authenticate] }, stockController.getLowStock);

  // Get stock by product ID
  app.get('/:productId', { preHandler: [authenticate] }, stockController.getByProductId);

  // Create stock record
  app.post('/', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, stockController.create);

  // Update stock record
  app.put('/:productId', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, stockController.update);

  // Add stock (increase quantity)
  app.post('/:productId/add', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, stockController.addStock);

  // Deduct stock (decrease quantity)
  app.post('/:productId/deduct', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, stockController.deductStock);

  // Get stock logs for a product
  app.get('/:productId/logs', { preHandler: [authenticate] }, stockController.getLogs);
}
