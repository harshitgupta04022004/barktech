import { CaseStudy, ICaseStudy } from '../models/caseStudy.js';

export class CaseStudyRepository {
  async findById(id: string): Promise<ICaseStudy | null> {
    return CaseStudy.findById(id);
  }

  async findBySlug(slug: string): Promise<ICaseStudy | null> {
    return CaseStudy.findOne({ slug });
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    tag?: string;
  }): Promise<{ caseStudies: ICaseStudy[]; total: number }> {
    const { page = 1, limit = 20, status, search, tag } = filters;
    const query: Record<string, any> = {};
    if (status) { query.status = status; } else { query.$or = [{ status: 'published' }, { published: true }]; }
    if (tag) query.tags = tag;
    if (search) {
      query.$text = { $search: search };
    }

    const [caseStudies, total] = await Promise.all([
      CaseStudy.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ publishedAt: -1, createdAt: -1 }),
      CaseStudy.countDocuments(query),
    ]);

    return { caseStudies, total };
  }

  async create(data: Partial<ICaseStudy>): Promise<ICaseStudy> {
    return CaseStudy.create(data);
  }

  async update(id: string, data: Partial<ICaseStudy>): Promise<ICaseStudy | null> {
    return CaseStudy.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await CaseStudy.findByIdAndDelete(id);
    return !!result;
  }
}

export const caseStudyRepository = new CaseStudyRepository();
