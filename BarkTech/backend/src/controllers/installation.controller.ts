import { FastifyRequest, FastifyReply } from 'fastify';
import { installationService } from '../services/installation.service.js';
import { z } from 'zod';

const createInstallationSchema = z.object({
  clientId: z.string(),
  productId: z.string(),
  machineModel: z.string().min(1),
  location: z.string().min(1),
  status: z.enum(['scheduled', 'in-progress', 'completed']).optional(),
  scheduledDate: z.string().transform((val) => new Date(val)),
  completedDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  engineer: z.string().min(1),
  notes: z.string().optional(),
  photos: z.array(z.object({
    url: z.string(),
    caption: z.string().optional(),
    takenAt: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  })).optional(),
});

const photoSchema = z.object({
  url: z.string(),
  caption: z.string().optional(),
  takenAt: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
});

export class InstallationController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, status, clientId, engineer, search } = request.query as any;
    const result = await installationService.listInstallations({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
      clientId,
      engineer,
      search,
    });
    return reply.send({
      success: true,
      data: result.installations,
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
    const installation = await installationService.getInstallation(id);
    return reply.send({ success: true, data: installation });
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createInstallationSchema.parse(request.body);
    const installation = await installationService.createInstallation(body);
    return reply.status(201).send({ success: true, data: installation });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = createInstallationSchema.partial().parse(request.body);
    const installation = await installationService.updateInstallation(id, body);
    return reply.send({ success: true, data: installation });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await installationService.deleteInstallation(id);
    return reply.send({ success: true, message: 'Installation deleted' });
  }

  async start(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const installation = await installationService.startInstallation(id);
    return reply.send({ success: true, data: installation });
  }

  async complete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const installation = await installationService.completeInstallation(id);
    return reply.send({ success: true, data: installation });
  }

  async reschedule(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { scheduledDate } = request.body as { scheduledDate: string };
    const installation = await installationService.rescheduleInstallation(id, new Date(scheduledDate));
    return reply.send({ success: true, data: installation });
  }

  async addPhoto(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = photoSchema.parse(request.body);
    const installation = await installationService.addPhoto(id, body);
    return reply.send({ success: true, data: installation });
  }

  async getByClient(request: FastifyRequest, reply: FastifyReply) {
    const { clientId } = request.params as { clientId: string };
    const installations = await installationService.getClientInstallations(clientId);
    return reply.send({ success: true, data: installations });
  }

  async getByDateRange(request: FastifyRequest, reply: FastifyReply) {
    const { startDate, endDate } = request.query as { startDate: string; endDate: string };
    const installations = await installationService.getInstallationsByDateRange(startDate, endDate);
    return reply.send({ success: true, data: installations });
  }
}

export const installationController = new InstallationController();
