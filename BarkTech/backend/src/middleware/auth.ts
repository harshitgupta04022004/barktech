import { FastifyRequest, FastifyReply } from 'fastify';
import type { JwtPayload } from '../types/index.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const decoded = await request.jwtVerify<JwtPayload>();
    (request as any).user = decoded;
  } catch (err) {
    reply.status(401).send({ success: false, error: 'Unauthorized' });
  }
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JwtPayload;
    if (!user || !roles.includes(user.role)) {
      reply.status(403).send({ success: false, error: 'Forbidden' });
    }
  };
}
