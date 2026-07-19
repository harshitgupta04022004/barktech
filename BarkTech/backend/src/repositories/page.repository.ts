import { Page, IPage } from '../models/page.js';

export class PageRepository {
  async findById(id: string): Promise<IPage | null> {
    return Page.findById(id);
  }

  async findBySlug(slug: string): Promise<IPage | null> {
    return Page.findOne({ slug });
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ pages: IPage[]; total: number }> {
    const { page = 1, limit = 20, status } = filters;
    const query: Record<string, any> = {};

    if (status) query.status = status;

    const [pages, total] = await Promise.all([
      Page.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Page.countDocuments(query),
    ]);

    return { pages, total };
  }

  async create(data: Partial<IPage>): Promise<IPage> {
    return Page.create(data);
  }

  async update(id: string, data: Partial<IPage>): Promise<IPage | null> {
    return Page.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await Page.findByIdAndDelete(id);
    return !!result;
  }
}

export const pageRepository = new PageRepository();
