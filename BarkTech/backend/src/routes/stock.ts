import { FastifyInstance } from 'fastify';

export async function stockRoutes(app: FastifyInstance) {
  app.get('/', async (_request, reply) => {
    return reply.send({ success: true, data: [], message: 'Stock module — not yet implemented' });
  });
}
