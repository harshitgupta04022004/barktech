import { FastifyInstance } from 'fastify';
import { invoiceController } from '../controllers/invoice.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export async function invoiceRoutes(app: FastifyInstance) {
  // All invoice routes require auth
  app.get('/', { preHandler: [authenticate] }, invoiceController.list);
  app.get('/stats', { preHandler: [authenticate] }, invoiceController.stats);
  app.get('/next-number', { preHandler: [authenticate] }, invoiceController.nextNumber);
  app.get('/validate-number/:number', { preHandler: [authenticate] }, invoiceController.validateNumber);
  app.get('/:id', { preHandler: [authenticate] }, invoiceController.getById);
  app.post('/', { preHandler: [authenticate, requireRole('super_admin', 'admin', 'sales')] }, invoiceController.create);
  app.put('/:id', { preHandler: [authenticate, requireRole('super_admin', 'admin', 'sales')] }, invoiceController.update);

  // Invoice status management
  app.post('/:id/submit', { preHandler: [authenticate, requireRole('super_admin', 'admin', 'sales')] }, invoiceController.submit);
  app.post('/:id/mark-paid', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, invoiceController.markPaid);
  app.post('/:id/partial-payment', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, invoiceController.partialPayment);
  app.post('/:id/cancel', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, invoiceController.cancel);

  // PDF generation
  app.get('/:id/pdf', { preHandler: [authenticate] }, invoiceController.generatePdf);
}
