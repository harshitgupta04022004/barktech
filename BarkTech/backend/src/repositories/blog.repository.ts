import { Blog, IBlog } from '../models/blog.js';

export class BlogRepository {
  async findById(id: string): Promise<IBlog | null> {
    return Blog.findById(id).populate('author');
  }

  async findBySlug(slug: string): Promise<IBlog | null> {
    return Blog.findOne({ slug }).populate('author');
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    tag?: string;
    search?: string;
  }): Promise<{ blogs: IBlog[]; total: number }> {
    const { page = 1, limit = 20, status, category, tag, search } = filters;
    const query: Record<string, any> = {};
    if (status) { query.status = status; } else { query.$or = [{ status: 'published' }, { published: true }]; }
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (search) {
      query.$text = { $search: search };
    }

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate('author')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ publishedAt: -1, createdAt: -1 }),
      Blog.countDocuments(query),
    ]);

    return { blogs, total };
  }

  async create(data: Partial<IBlog>): Promise<IBlog> {
    return Blog.create(data);
  }

  async update(id: string, data: Partial<IBlog>): Promise<IBlog | null> {
    return Blog.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await Blog.findByIdAndDelete(id);
    return !!result;
  }
}

export const blogRepository = new BlogRepository();
