import { FastifyRequest, FastifyReply } from 'fastify';
import { campaignService } from '../services/campaign.service.js';
import { z } from 'zod';

const createCampaignSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  content: z.string().min(1),
  platform: z.string().optional(),
  platforms: z.array(z.string()).optional(),
  hashtags: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'paused']).optional(),
  scheduledDate: z.string().optional(),
  scheduledAt: z.string().optional(),
  media: z.array(z.string()).optional(),
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
    const user = (request as any).user;

    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const platformList = body.platforms || (body.platform ? [body.platform] : ['all']);
    const tagList = body.tags || (body.hashtags ? body.hashtags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);

    const campaignData = {
      title: body.title,
      slug,
      content: body.content,
      platforms: platformList,
      status: body.status || 'draft',
      scheduledAt: body.scheduledAt || body.scheduledDate || undefined,
      media: body.media || [],
      tags: tagList,
      author: user?.sub || null,
    };

    const campaign = await campaignService.createCampaign(campaignData);
    return reply.status(201).send({ success: true, data: campaign });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = createCampaignSchema.partial().parse(request.body);

    const updateData: any = { ...body };
    if (body.platform) {
      updateData.platforms = body.platforms || [body.platform];
      delete updateData.platform;
    }
    if (body.hashtags && !body.tags) {
      updateData.tags = body.hashtags.split(',').map((t: string) => t.trim()).filter(Boolean);
      delete updateData.hashtags;
    }
    if (body.scheduledDate && !body.scheduledAt) {
      updateData.scheduledAt = body.scheduledDate;
      delete updateData.scheduledDate;
    }

    const campaign = await campaignService.updateCampaign(id, updateData);
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
