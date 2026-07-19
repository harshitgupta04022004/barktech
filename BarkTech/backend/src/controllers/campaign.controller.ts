import { FastifyRequest, FastifyReply } from 'fastify';
import { campaignService } from '../services/campaign.service.js';
import { z } from 'zod';

const createCampaignSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().min(1),
  platforms: z
    .array(z.enum(['linkedin', 'instagram', 'facebook', 'twitter', 'reddit']))
    .optional(),
  status: z.enum(['draft', 'scheduled', 'published']).optional(),
  scheduledAt: z.string().datetime().optional(),
  media: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  author: z.string(),
});

export class CampaignController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, status, platform, search } = request.query as any;
    const result = await campaignService.listCampaigns({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
      platform,
      search,
    });
    return reply.send({
      success: true,
      data: result.campaigns,
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
    const campaign = await campaignService.getCampaign(id);
    return reply.send({ success: true, data: campaign });
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createCampaignSchema.parse(request.body);
    const campaign = await campaignService.createCampaign(body);
    return reply.status(201).send({ success: true, data: campaign });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = createCampaignSchema.partial().parse(request.body);
    const campaign = await campaignService.updateCampaign(id, body);
    return reply.send({ success: true, data: campaign });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await campaignService.deleteCampaign(id);
    return reply.send({ success: true, message: 'Campaign deleted' });
  }

  async publish(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const campaign = await campaignService.publishCampaign(id);
    return reply.send({ success: true, data: campaign });
  }

  async stats(request: FastifyRequest, reply: FastifyReply) {
    const stats = await campaignService.getStats();
    return reply.send({ success: true, data: stats });
  }
}

export const campaignController = new CampaignController();
