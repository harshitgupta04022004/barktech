import { Subscriber, ISubscriber, SubscriberStatus } from '../models/subscriber.js';

export class SubscriberRepository {
  async findById(id: string): Promise<ISubscriber | null> {
    return Subscriber.findById(id);
  }

  async findByEmail(email: string): Promise<ISubscriber | null> {
    return Subscriber.findOne({ email: email.toLowerCase() });
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    status?: SubscriberStatus;
  }): Promise<{ subscribers: ISubscriber[]; total: number }> {
    const { page = 1, limit = 20, status } = filters;
    const query: Record<string, any> = {};

    if (status) query.status = status;

    const [subscribers, total] = await Promise.all([
      Subscriber.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Subscriber.countDocuments(query),
    ]);

    return { subscribers, total };
  }

  async create(data: Partial<ISubscriber>): Promise<ISubscriber> {
    return Subscriber.create(data);
  }

  async update(id: string, data: Partial<ISubscriber>): Promise<ISubscriber | null> {
    return Subscriber.findByIdAndUpdate(id, data, { new: true });
  }

  async countByStatus(): Promise<Record<SubscriberStatus, number>> {
    const results = await Subscriber.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const counts: Record<string, number> = { active: 0, unsubscribed: 0 };
    for (const r of results) {
      counts[r._id] = r.count;
    }
    return counts as Record<SubscriberStatus, number>;
  }

  async getActiveSubscribers(): Promise<ISubscriber[]> {
    return Subscriber.find({ status: 'active' }).sort({ createdAt: -1 });
  }
}

export const subscriberRepository = new SubscriberRepository();
