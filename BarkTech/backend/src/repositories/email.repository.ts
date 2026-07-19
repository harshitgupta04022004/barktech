import { EmailSubscriber, EmailSequence, EmailSequenceLog, IEmailSubscriber, IEmailSequence } from '../models/email.js';

export class EmailRepository {
  async subscribe(email: string, name?: string, source?: string): Promise<IEmailSubscriber> {
    const existing = await EmailSubscriber.findOne({ email });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.unsubscribedAt = undefined;
        return existing.save();
      }
      return existing;
    }
    return EmailSubscriber.create({ email, name, source });
  }

  async unsubscribe(email: string): Promise<boolean> {
    const r = await EmailSubscriber.updateOne({ email }, { isActive: false, unsubscribedAt: new Date() });
    return r.modifiedCount > 0;
  }

  async findAllSubscribers(page = 1, limit = 50): Promise<{ subscribers: IEmailSubscriber[]; total: number }> {
    const [subscribers, total] = await Promise.all([
      EmailSubscriber.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      EmailSubscriber.countDocuments(),
    ]);
    return { subscribers, total };
  }

  async findAllSequences(): Promise<IEmailSequence[]> {
    return EmailSequence.find({ isActive: true });
  }

  async createSequence(data: Partial<IEmailSequence>): Promise<IEmailSequence> {
    return EmailSequence.create(data);
  }

  async logSequenceEmail(data: any): Promise<void> {
    await EmailSequenceLog.create(data);
  }

  async getSequenceLogs(sequenceId: string, page = 1, limit = 50): Promise<{ logs: any[]; total: number }> {
    const [logs, total] = await Promise.all([
      EmailSequenceLog.find({ sequenceId }).populate('subscriberId').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      EmailSequenceLog.countDocuments({ sequenceId }),
    ]);
    return { logs, total };
  }
}

export const emailRepository = new EmailRepository();
