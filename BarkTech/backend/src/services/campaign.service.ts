import { campaignRepository } from '../repositories/campaign.repository.js';
import { AppError } from '../utils/errors.js';
import { CampaignStatus, CampaignPlatform } from '../models/campaign.js';

export class CampaignService {
  async getCampaign(id: string) {
    const campaign = await campaignRepository.findById(id);
    if (!campaign) throw new AppError('Campaign not found', 404);
    return campaign;
  }

  async getCampaignBySlug(slug: string) {
    const campaign = await campaignRepository.findBySlug(slug);
    if (!campaign) throw new AppError('Campaign not found', 404);
    return campaign;
  }

  async listCampaigns(filters: {
    page?: number;
    limit?: number;
    status?: CampaignStatus;
    platform?: CampaignPlatform;
    search?: string;
  }) {
    return campaignRepository.findAll(filters);
  }

  async createCampaign(data: any) {
    return campaignRepository.create(data);
  }

  async updateCampaign(id: string, data: any) {
    const campaign = await campaignRepository.update(id, data);
    if (!campaign) throw new AppError('Campaign not found', 404);
    return campaign;
  }

  async deleteCampaign(id: string) {
    const deleted = await campaignRepository.delete(id);
    if (!deleted) throw new AppError('Campaign not found', 404);
  }

  async publishCampaign(id: string) {
    const campaign = await campaignRepository.update(id, {
      status: 'published',
      publishedAt: new Date(),
    });
    if (!campaign) throw new AppError('Campaign not found', 404);
    return campaign;
  }

  async scheduleCampaign(id: string, scheduledAt: Date) {
    if (scheduledAt <= new Date()) {
      throw new AppError('Scheduled date must be in the future', 400);
    }
    const campaign = await campaignRepository.update(id, {
      status: 'scheduled',
      scheduledAt,
    });
    if (!campaign) throw new AppError('Campaign not found', 404);
    return campaign;
  }

  async getStats() {
    const statusCounts = await campaignRepository.countByStatus();
    return {
      ...statusCounts,
      total: statusCounts.draft + statusCounts.scheduled + statusCounts.published,
    };
  }
}

export const campaignService = new CampaignService();
