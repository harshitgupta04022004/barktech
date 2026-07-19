import { EmailSequence, IEmailSequence } from '../models/emailSequence.js';

export class EmailSequenceRepository {
  async findById(id: string): Promise<IEmailSequence | null> {
    return EmailSequence.findById(id);
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  } = {}): Promise<{ sequences: IEmailSequence[]; total: number }> {
    const { page = 1, limit = 20, isActive } = filters;
    const query: Record<string, any> = {};

    if (isActive !== undefined) query.isActive = isActive;

    const [sequences, total] = await Promise.all([
      EmailSequence.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      EmailSequence.countDocuments(query),
    ]);

    return { sequences, total };
  }

  async create(data: Partial<IEmailSequence>): Promise<IEmailSequence> {
    return EmailSequence.create(data);
  }

  async update(id: string, data: Partial<IEmailSequence>): Promise<IEmailSequence | null> {
    return EmailSequence.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await EmailSequence.findByIdAndDelete(id);
    return !!result;
  }

  async findActiveSequences(): Promise<IEmailSequence[]> {
    return EmailSequence.find({ isActive: true }).sort({ createdAt: -1 });
  }
}

export const emailSequenceRepository = new EmailSequenceRepository();
