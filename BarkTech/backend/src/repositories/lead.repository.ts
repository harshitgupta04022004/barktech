import { Lead, ILead } from '../models/lead.js';

export class LeadRepository {
  async findById(id: string): Promise<ILead | null> {
    return Lead.findById(id).populate('assignedTo');
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
  }): Promise<{ leads: ILead[]; total: number }> {
    const { page = 1, limit = 20, status, priority } = filters;
    const query: Record<string, any> = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const [leads, total] = await Promise.all([
      Lead.find(query)
        .populate('assignedTo')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Lead.countDocuments(query),
    ]);

    return { leads, total };
  }

  async create(data: Partial<ILead>): Promise<ILead> {
    return Lead.create(data);
  }

  async update(id: string, data: Partial<ILead>): Promise<ILead | null> {
    return Lead.findByIdAndUpdate(id, data, { new: true });
  }

  async getStats(): Promise<Record<string, number>> {
    const results = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return results.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {} as Record<string, number>);
  }
}

export const leadRepository = new LeadRepository();
