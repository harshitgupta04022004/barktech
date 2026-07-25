import { FastifyRequest, FastifyReply } from 'fastify';
import pino from 'pino';

const logger = pino({ name: 'webhook' });

export const webhookController = {
  async handlePublishConfirmation(request: FastifyRequest, reply: FastifyReply) {
    logger.warn('Social publishing disabled — webhook ignored');
    return reply.send({ success: true, message: 'Social publishing is disabled' });
  },

  async checkWebhookTimeouts() {
    return 0;
  },
};
