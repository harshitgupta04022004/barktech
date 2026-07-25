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

  async getStats(): Promise<{ byStatus: Record<string, number>; bySource: Record<string, number>; total: number }> {
    const [statusResults, sourceResults] = await Promise.all([
      Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Lead.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
    ]);

    const byStatus = statusResults.reduce((acc: Record<string, number>, r: any) => {
      acc[r._id] = r.count;
      return acc;
    }, {} as Record<string, number>);

    const bySource = sourceResults.reduce((acc: Record<string, number>, r: any) => {
      acc[r._id] = r.count;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(byStatus).reduce((a: number, b: number) => a + b, 0);

    return { byStatus, bySource, total };
  }
}

export const leadRepository = new LeadRepository();
