import { AuditLog, IAuditLog } from '../models/auditLog.js';

export class AuditRepository {
  async create(data: Partial<IAuditLog>): Promise<IAuditLog> {
    return AuditLog.create(data);
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ logs: IAuditLog[]; total: number }> {
    const { page = 1, limit = 50, userId, action, resource, startDate, endDate } = filters;
    const query: Record<string, any> = {};

    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ timestamp: -1 }),
      AuditLog.countDocuments(query),
    ]);

    return { logs, total };
  }

  async getStats(): Promise<{ action: string; count: number }[]> {
    return AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $project: { action: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);
  }
}

export const auditRepository = new AuditRepository();
