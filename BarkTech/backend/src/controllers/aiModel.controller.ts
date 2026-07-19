import { FastifyRequest, FastifyReply } from 'fastify';
import { aiModelService } from '../services/aiModel.service.js';
import { z } from 'zod';

const createModelSchema = z.object({
  name: z.string().min(1),
  modelId: z.string().min(1),
  provider: z.string().default('openrouter'),
  description: z.string().default(''),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  role: z.enum(['client', 'admin']),
  maxTokens: z.number().min(1).default(2048),
  temperature: z.number().min(0).max(2).default(0.2),
});

const updateModelSchema = createModelSchema.partial();

export class AIModelController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { role } = request.query as { role?: string };
    const models = await aiModelService.listModels(role);
    return reply.send({ success: true, data: models });
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const model = await aiModelService.getModel(id);
    return reply.send({ success: true, data: model });
  }

  async getDefault(request: FastifyRequest, reply: FastifyReply) {
    const { role } = request.params as { role: string };
    const model = await aiModelService.getDefaultModel(role);
    return reply.send({ success: true, data: model });
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createModelSchema.parse(request.body);
    const model = await aiModelService.createModel(body);
    return reply.status(201).send({ success: true, data: model });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = updateModelSchema.parse(request.body);
    const model = await aiModelService.updateModel(id, body);
    return reply.send({ success: true, data: model });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await aiModelService.deleteModel(id);
    return reply.send({ success: true, message: 'Model deleted' });
  }

  async setDefault(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await aiModelService.setDefault(id);
    return reply.send({ success: true, message: 'Default model updated' });
  }

  async toggleActive(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const model = await aiModelService.toggleActive(id);
    return reply.send({ success: true, data: model });
  }
}

export const aiModelController = new AIModelController();
