import { CaseStudy, BlogPost, Page, ICaseStudy, IBlogPost, IPage } from '../models/cms.js';
import { AppError } from '../utils/errors.js';

export class CmsRepository {
  // ── Case Studies ─────────────────────────────────
  async findCaseStudies(page = 1, limit = 10, publishedOnly = false): Promise<{ items: ICaseStudy[]; total: number }> {
    const q = publishedOnly ? { published: true } : {};
    const [items, total] = await Promise.all([
      CaseStudy.find(q).skip((page - 1) * limit).limit(limit).sort({ publishedAt: -1 }),
      CaseStudy.countDocuments(q),
    ]);
    return { items, total };
  }
  async findCaseStudyBySlug(slug: string): Promise<ICaseStudy | null> { return CaseStudy.findOne({ slug, published: true }); }
  async createCaseStudy(d: Partial<ICaseStudy>): Promise<ICaseStudy> { return CaseStudy.create(d); }
  async updateCaseStudy(id: string, d: Partial<ICaseStudy>): Promise<ICaseStudy | null> { return CaseStudy.findByIdAndUpdate(id, d, { new: true }); }
  async deleteCaseStudy(id: string): Promise<boolean> { const r = await CaseStudy.findByIdAndDelete(id); return !!r; }

  // ── Blog Posts ──────────────────────────────────
  async findBlogPosts(page = 1, limit = 10, publishedOnly = false): Promise<{ items: IBlogPost[]; total: number }> {
    const q = publishedOnly ? { published: true } : {};
    const [items, total] = await Promise.all([
      BlogPost.find(q).skip((page - 1) * limit).limit(limit).sort({ publishedAt: -1 }),
      BlogPost.countDocuments(q),
    ]);
    return { items, total };
  }
  async findBlogPostBySlug(slug: string): Promise<IBlogPost | null> { return BlogPost.findOne({ slug, published: true }); }
  async createBlogPost(d: Partial<IBlogPost>): Promise<IBlogPost> { return BlogPost.create(d); }
  async updateBlogPost(id: string, d: Partial<IBlogPost>): Promise<IBlogPost | null> { return BlogPost.findByIdAndUpdate(id, d, { new: true }); }
  async deleteBlogPost(id: string): Promise<boolean> { const r = await BlogPost.findByIdAndDelete(id); return !!r; }

  // ── Pages ────────────────────────────────────────
  async findPages(): Promise<IPage[]> { return Page.find({ published: true }); }
  async findPageBySlug(slug: string): Promise<IPage | null> { return Page.findOne({ slug, published: true }); }
  async createPage(d: Partial<IPage>): Promise<IPage> { return Page.create(d); }
  async updatePage(id: string, d: Partial<IPage>): Promise<IPage | null> { return Page.findByIdAndUpdate(id, d, { new: true }); }
}

export const cmsRepository = new CmsRepository();
