import { FastifyRequest, FastifyReply } from 'fastify';
import { emailService } from '../services/email.service.js';
import { z } from 'zod';

const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  html: z.string().min(1),
  from: z.string().optional(),
});

const createSequenceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  steps: z.array(
    z.object({
      delayDays: z.number().min(0),
      templateId: z.string().min(1),
      subject: z.string().min(1),
    })
  ),
});

export class EmailController {
  async subscribe(request: FastifyRequest, reply: FastifyReply) {
    const { email, name } = subscribeSchema.parse(request.body);
    const subscriber = await emailService.subscribe(email, name);
    return reply.status(201).send({ success: true, data: subscriber });
  }

  async unsubscribe(request: FastifyRequest, reply: FastifyReply) {
    const { email } = request.body as { email: string };
    await emailService.unsubscribe(email);
    return reply.send({ success: true, message: 'Unsubscribed successfully' });
  }

  async listSubscribers(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, status } = request.query as any;
    const result = await emailService.listSubscribers(
      Number(page) || 1,
      Number(limit) || 20,
      status
    );
    return reply.send({
      success: true,
      data: result.subscribers,
      meta: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 20)),
      },
    });
  }

  async send(request: FastifyRequest, reply: FastifyReply) {
    const body = sendEmailSchema.parse(request.body);
    const result = await emailService.sendEmail(body);
    return reply.send({ success: true, data: result });
  }

  async listSequences(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, isActive } = request.query as any;
    const result = await emailService.listSequences(
      Number(page) || 1,
      Number(limit) || 20,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined
    );
    return reply.send({
      success: true,
      data: result.sequences,
      meta: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 20)),
      },
    });
  }

  async createSequence(request: FastifyRequest, reply: FastifyReply) {
    const body = createSequenceSchema.parse(request.body);
    const sequence = await emailService.createSequence(body);
    return reply.status(201).send({ success: true, data: sequence });
  }
}

export const emailController = new EmailController();
