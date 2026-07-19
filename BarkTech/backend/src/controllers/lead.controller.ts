import { FastifyRequest, FastifyReply } from 'fastify';
import { leadService } from '../services/lead.service.js';
import { z } from 'zod';

const createLeadSchema = z.object({
  contactName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  country: z.string().optional(),
  source: z.enum(['website', 'ai_chat', 'phone', 'email', 'referral', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  rfqItems: z
    .array(
      z.object({
        productId: z.string().optional(),
        productName: z.string(),
        quantity: z.number().min(1),
        unit: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  notes: z.string().optional(),
});

export class LeadController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, status, priority } = request.query as any;
    const result = await leadService.listLeads({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
      priority,
    });
    return reply.send({
      success: true,
      data: result.leads,
      meta: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 20)),
      },
    });
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const lead = await leadService.getLead(id);
    return reply.send({ success: true, data: lead });
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createLeadSchema.parse(request.body);
    const lead = await leadService.createLead(body);
    return reply.status(201).send({ success: true, data: lead });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = createLeadSchema.partial().parse(request.body);
    const lead = await leadService.updateLead(id, body);
    return reply.send({ success: true, data: lead });
  }

  async stats(request: FastifyRequest, reply: FastifyReply) {
    const stats = await leadService.getStats();
    return reply.send({ success: true, data: stats });
  }
}

export const leadController = new LeadController();
