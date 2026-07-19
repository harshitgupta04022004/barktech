import { FastifyInstance } from 'fastify';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export async function analyticsRoutes(app: FastifyInstance) {
  // Track is public (no auth)
  app.post('/track', analyticsController.track);

  // All other analytics routes require admin auth
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireRole('super_admin', 'admin'));

  app.get('/page-views', analyticsController.pageViews);
  app.get('/product-views', analyticsController.productViews);
  app.get('/search', analyticsController.search);
  app.get('/dashboard', analyticsController.dashboard);
  app.get('/top-products', analyticsController.topProducts);
  app.get('/funnel', analyticsController.funnel);
}
