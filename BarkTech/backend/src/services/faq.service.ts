import { faqRepository } from '../repositories/faq.repository.js';
import { AppError } from '../utils/errors.js';

export class FAQService {
  async getFAQ(id: string) {
    const faq = await faqRepository.findById(id);
    if (!faq) throw new AppError('FAQ not found', 404);
    return faq;
  }

  async listFAQs(filters: {
    page?: number;
    limit?: number;
    category?: string;
    isActive?: boolean;
  }) {
    return faqRepository.findAll(filters);
  }

  async createFAQ(data: any) {
    return faqRepository.create(data);
  }

  async updateFAQ(id: string, data: any) {
    const faq = await faqRepository.update(id, data);
    if (!faq) throw new AppError('FAQ not found', 404);
    return faq;
  }

  async deleteFAQ(id: string) {
    const deleted = await faqRepository.delete(id);
    if (!deleted) throw new AppError('FAQ not found', 404);
  }

  async toggleFAQ(id: string) {
    const faq = await faqRepository.findById(id);
    if (!faq) throw new AppError('FAQ not found', 404);
    const updated = await faqRepository.update(id, { isActive: !faq.isActive });
    return updated;
  }
}

export const faqService = new FAQService();
