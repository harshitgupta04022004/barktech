import { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';

export async function settingsRoutes(app: FastifyInstance) {
  // Service status endpoint — checks which integrations are configured
  app.get('/status', { preHandler: [authenticate] }, async () => {
    const services = [
      {
        name: 'OpenRouter (AI Models)',
        status: env.OPENROUTER_API_KEY ? 'connected' : 'not configured',
        desc: 'AI model provider — configurable in AI Model Management above',
      },
      {
        name: 'MongoDB Atlas',
        status: 'connected',
        desc: 'Primary database — Cluster0',
      },
      {
        name: 'Redis (Upstash)',
        status: env.REDIS_URL ? 'connected' : 'not configured',
        desc: 'Cache and rate limiting',
      },
      {
        name: 'Resend (Email)',
        status: env.RESEND_API_KEY ? 'connected' : 'not configured',
        desc: 'Transactional email delivery',
      },
      {
        name: 'WhatsApp Business',
        status: 'not configured',
        desc: 'Admin notifications and customer follow-ups',
      },
      {
        name: 'Google Calendar',
        status: env.GOOGLE_CLIENT_ID ? 'connected' : 'not configured',
        desc: 'Installation and demo scheduling',
      },
      {
        name: 'Backblaze B2 (S3 Storage)',
        status: (env.S3_ENDPOINT_URL && env.S3_BUCKET && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) ? 'connected' : 'not configured',
        desc: 'Media and PDF storage',
      },
    ];

    return { success: true, data: services };
  });
}
