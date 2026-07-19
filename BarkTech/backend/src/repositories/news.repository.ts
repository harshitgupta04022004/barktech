import { News, INews } from '../models/news.js';

export class NewsRepository {
  async findById(id: string): Promise<INews | null> {
    return News.findById(id).populate('author');
  }

  async findBySlug(slug: string): Promise<INews | null> {
    return News.findOne({ slug }).populate('author');
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  }): Promise<{ news: INews[]; total: number }> {
    const { page = 1, limit = 20, status, category, search } = filters;
    const query: Record<string, any> = {};

    if (status) {
      query.status = status;
    } else {
      query.$or = [{ status: 'published' }, { published: true }];
    }
    if (category) query.category = category;
    if (search) {
      query.$text = { $search: search };
    }

    const [news, total] = await Promise.all([
      News.find(query)
        .populate('author')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ publishedAt: -1, createdAt: -1 }),
      News.countDocuments(query),
    ]);

    return { news, total };
  }

  async create(data: Partial<INews>): Promise<INews> {
    return News.create(data);
  }

  async update(id: string, data: Partial<INews>): Promise<INews | null> {
    return News.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await News.findByIdAndDelete(id);
    return !!result;
  }
}

export const newsRepository = new NewsRepository();
