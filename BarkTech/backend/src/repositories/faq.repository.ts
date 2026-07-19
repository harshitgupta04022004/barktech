import { FAQ, IFAQ } from '../models/faq.js';

export class FAQRepository {
  async findById(id: string): Promise<IFAQ | null> {
    return FAQ.findById(id);
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    category?: string;
    isActive?: boolean;
  }): Promise<{ faqs: IFAQ[]; total: number }> {
    const { page = 1, limit = 50, category, isActive = true } = filters;
    const query: Record<string, any> = {};

    if (isActive !== undefined) query.isActive = isActive;
    if (category) query.category = category;

    const [faqs, total] = await Promise.all([
      FAQ.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ order: 1, createdAt: -1 }),
      FAQ.countDocuments(query),
    ]);

    return { faqs, total };
  }

  async create(data: Partial<IFAQ>): Promise<IFAQ> {
    return FAQ.create(data);
  }

  async update(id: string, data: Partial<IFAQ>): Promise<IFAQ | null> {
    return FAQ.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await FAQ.findByIdAndDelete(id);
    return !!result;
  }
}

export const faqRepository = new FAQRepository();
