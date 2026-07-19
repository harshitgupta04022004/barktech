import { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    return { status: 'ok', service: 'bark-api', timestamp: new Date().toISOString() };
  });

  app.get('/health/ready', async (request, reply) => {
    // Add DB/Redis readiness checks here
    return reply.send({ status: 'ready' });
  });
}
