import { Campaign, ICampaign, CampaignStatus, CampaignPlatform } from '../models/campaign.js';

export class CampaignRepository {
  async findById(id: string): Promise<ICampaign | null> {
    return Campaign.findById(id).populate('author', 'name email');
  }

  async findBySlug(slug: string): Promise<ICampaign | null> {
    return Campaign.findOne({ slug }).populate('author', 'name email');
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    status?: CampaignStatus;
    platform?: CampaignPlatform;
    search?: string;
  }): Promise<{ campaigns: ICampaign[]; total: number }> {
    const { page = 1, limit = 20, status, platform, search } = filters;
    const query: Record<string, any> = {};

    if (status) query.status = status;
    if (platform) query.platforms = platform;
    if (search) {
      query.$text = { $search: search };
    }

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('author', 'name email')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Campaign.countDocuments(query),
    ]);

    return { campaigns, total };
  }

  async create(data: Partial<ICampaign>): Promise<ICampaign> {
    return Campaign.create(data);
  }

  async update(id: string, data: Partial<ICampaign>): Promise<ICampaign | null> {
    return Campaign.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await Campaign.findByIdAndDelete(id);
    return !!result;
  }

  async findByStatus(status: CampaignStatus): Promise<ICampaign[]> {
    return Campaign.find({ status })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
  }

  async findByPlatform(platform: CampaignPlatform): Promise<ICampaign[]> {
    return Campaign.find({ platforms: platform })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
  }

  async countByStatus(): Promise<Record<CampaignStatus, number>> {
    const results = await Campaign.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const counts: Record<string, number> = { draft: 0, scheduled: 0, published: 0 };
    for (const r of results) {
      counts[r._id] = r.count;
    }
    return counts as Record<CampaignStatus, number>;
  }
}

export const campaignRepository = new CampaignRepository();
