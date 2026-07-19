import { subscriberRepository } from '../repositories/subscriber.repository.js';
import { emailSequenceRepository } from '../repositories/emailSequence.repository.js';
import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';

export class EmailService {
  // ── Subscribers ──────────────────────────────────────
  async subscribe(email: string, name?: string) {
    const existing = await subscriberRepository.findByEmail(email);
    if (existing) {
      if (existing.status === 'active') {
        throw new AppError('Email already subscribed', 409);
      }
      // Re-subscribe
      return subscriberRepository.update(existing._id.toString(), {
        status: 'active',
        doubleOptIn: new Date(),
        unsubscribedAt: undefined,
        name: name || existing.name,
      });
    }
    return subscriberRepository.create({ email, name });
  }

  async unsubscribe(email: string) {
    const subscriber = await subscriberRepository.findByEmail(email);
    if (!subscriber) throw new AppError('Subscriber not found', 404);
    if (subscriber.status === 'unsubscribed') {
      throw new AppError('Already unsubscribed', 409);
    }
    return subscriberRepository.update(subscriber._id.toString(), {
      status: 'unsubscribed',
      unsubscribedAt: new Date(),
    });
  }

  async listSubscribers(page = 1, limit = 20, status?: string) {
    return subscriberRepository.findAll({
      page,
      limit,
      status: status as any,
    });
  }

  async getSubscriberStats() {
    return subscriberRepository.countByStatus();
  }

  // ── Send Email via Resend ────────────────────────────
  async sendEmail(params: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
  }) {
    if (!env.RESEND_API_KEY) {
      throw new AppError('Resend API key not configured', 500);
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from || 'Bark Technologies <onboarding@resend.dev>',
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AppError(`Email send failed: ${error}`, 500);
    }

    return response.json();
  }

  // ── Sequences ────────────────────────────────────────
  async listSequences(page = 1, limit = 20, isActive?: boolean) {
    return emailSequenceRepository.findAll({ page, limit, isActive });
  }

  async createSequence(data: {
    name: string;
    description?: string;
    steps: { delayDays: number; templateId: string; subject: string }[];
  }) {
    return emailSequenceRepository.create(data);
  }

  async getSequence(id: string) {
    const sequence = await emailSequenceRepository.findById(id);
    if (!sequence) throw new AppError('Sequence not found', 404);
    return sequence;
  }

  async updateSequence(id: string, data: any) {
    const sequence = await emailSequenceRepository.update(id, data);
    if (!sequence) throw new AppError('Sequence not found', 404);
    return sequence;
  }

  async deleteSequence(id: string) {
    const deleted = await emailSequenceRepository.delete(id);
    if (!deleted) throw new AppError('Sequence not found', 404);
  }
}

export const emailService = new EmailService();
