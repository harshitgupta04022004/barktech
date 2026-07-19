import { FastifyInstance } from 'fastify';
import { emailController } from '../controllers/email.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export async function emailRoutes(app: FastifyInstance) {
  // Public subscription endpoints
  app.post('/subscribe', emailController.subscribe);
  app.delete('/unsubscribe', emailController.unsubscribe);

  // Admin-only endpoints
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireRole('super_admin', 'admin'));

  app.get('/subscribers', emailController.listSubscribers);
  app.post('/send', emailController.send);
  app.get('/sequences', emailController.listSequences);
  app.post('/sequences', emailController.createSequence);
}
