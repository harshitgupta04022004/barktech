import { FastifyInstance } from 'fastify';
import { webhookController } from '../controllers/webhook.controller.js';

export async function webhookRoutes(app: FastifyInstance) {
  // Webhook endpoint for async platform publish confirmations
  // No auth required — called by external platforms
  app.post('/publish/confirm', webhookController.handlePublishConfirmation);
}
