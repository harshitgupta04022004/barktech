import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { authRoutes } from './routes/auth.js';
import { productRoutes } from './routes/products.js';
import { leadRoutes } from './routes/leads.js';
import { invoiceRoutes } from './routes/invoices.js';
import { healthRoutes } from './routes/health.js';
import { stockRoutes } from './routes/stock.js';
import { installationRoutes } from './routes/installations.js';
import { emailRoutes } from './routes/email.js';
import { chatRoutes } from './routes/chat.js';
import { userRoutes } from './routes/users.js';
import { chatLogRoutes } from './routes/chatLogs.js';
import { aiModelRoutes } from './routes/aiModels.js';
import { contentPostRoutes } from './routes/contentPosts.js';
import { contentRoutes } from './routes/content.js';
import { webhookRoutes } from './routes/webhooks.js';
import { settingsRoutes } from './routes/settings.js';
import { liveShowcaseRoutes } from './routes/liveShowcase.js';
import { chatObservabilityRoutes } from './routes/chat_observability.js';
import { mediaRoutes } from './routes/media.js';
import { schedulerService } from './services/scheduler.service.js';

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
});

// ── Plugins ──────────────────────────────────────────
await app.register(cors, {
  origin: env.NODE_ENV === 'production' ? false : true,
  credentials: true,
});

await app.register(jwt, {
  secret: env.JWT_SECRET,
  sign: { expiresIn: env.JWT_EXPIRES_IN },
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

await app.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 10,
  },
});

// ── Routes ───────────────────────────────────────────
await app.register(healthRoutes);
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(productRoutes, { prefix: '/api/products' });
await app.register(leadRoutes, { prefix: '/api/leads' });
await app.register(invoiceRoutes, { prefix: '/api/invoices' });
await app.register(stockRoutes, { prefix: '/api/stock' });
await app.register(installationRoutes, { prefix: '/api/installations' });
await app.register(emailRoutes, { prefix: '/api/email' });
await app.register(chatRoutes, { prefix: '/api/chat' });
await app.register(userRoutes, { prefix: '/api/users' });
await app.register(chatLogRoutes, { prefix: '/api/chat-logs' });
await app.register(aiModelRoutes, { prefix: '/api/ai-models' });
await app.register(contentPostRoutes, { prefix: '/api/content-posts' });
await app.register(contentRoutes, { prefix: '/api/v1/content' });
await app.register(webhookRoutes, { prefix: '/api/v1/webhooks' });
await app.register(settingsRoutes, { prefix: '/api/settings' });
await app.register(liveShowcaseRoutes, { prefix: '/api/live-showcase' });
await app.register(chatObservabilityRoutes, { prefix: '/api/chat-observability' });
await app.register(mediaRoutes, { prefix: '/api/media' });

// ── Start ────────────────────────────────────────────
async function start() {
  try {
    await connectDatabase();
    connectRedis();

    // Seed default AI models on first run
    const { aiModelService } = await import('./services/aiModel.service.js');
    await aiModelService.seedDefaults();

    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info({ port: env.PORT }, 'Bark Technologies API running');

    // Start scheduler for scheduled publishing
    schedulerService.startPoller();
    schedulerService.startWorker();
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

// ── Graceful shutdown ────────────────────────────────
const shutdown = async () => {
  logger.info('Shutting down...');
  await schedulerService.shutdown();
  await app.close();
  await disconnectDatabase();
  await disconnectRedis();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
