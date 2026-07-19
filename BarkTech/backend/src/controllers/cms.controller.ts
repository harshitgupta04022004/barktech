import { FastifyRequest, FastifyReply } from 'fastify';
import { caseStudyService } from '../services/caseStudy.service.js';
import { newsService } from '../services/news.service.js';
import { blogService } from '../services/blog.service.js';
import { faqService } from '../services/faq.service.js';
import { officeService } from '../services/office.service.js';
import { pageService } from '../services/page.service.js';
import { z } from 'zod';

// ── Case Study schemas ──────────────────────────────
const createCaseStudySchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  client: z.string().min(1),
  industry: z.string().min(1),
  problem: z.string().min(1),
  solution: z.string().min(1),
  results: z.string().min(1),
  testimonial: z.object({
    quote: z.string().optional(),
    author: z.string().optional(),
    designation: z.string().optional(),
  }).optional(),
  featuredImage: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).optional(),
  author: z.string(),
});

// ── News schemas ────────────────────────────────────
const createNewsSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  category: z.enum(['consignment', 'installation', 'event']),
  featuredImage: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).optional(),
  author: z.string(),
});

// ── Blog schemas ────────────────────────────────────
const createBlogSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().optional(),
  author: z.string(),
  status: z.enum(['draft', 'published']).optional(),
  readTime: z.number().optional(),
});

// ── FAQ schemas ─────────────────────────────────────
const createFAQSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().min(1),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

// ── Office schemas ──────────────────────────────────
const createOfficeSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  isActive: z.boolean().optional(),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }).optional(),
});

// ── Page schemas ────────────────────────────────────
const createPageSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().min(1),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
});

// ════════════════════════════════════════════════════
// Case Study Controller
// ════════════════════════════════════════════════════
export class CaseStudyController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, status, search, tag } = request.query as any;
    const result = await caseStudyService.listCaseStudies({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
      search,
      tag,
    });
    return reply.send({
      success: true,
      data: result.caseStudies,
      meta: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 20)),
      },
    });
  }

  async getBySlug(request: FastifyRequest, reply: FastifyReply) {
    const { slug } = request.params as { slug: string };
    const caseStudy = await caseStudyService.getCaseStudyBySlug(slug);
    return reply.send({ success: true, data: caseStudy });
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const caseStudy = await caseStudyService.getCaseStudy(id);
    return reply.send({ success: true, data: caseStudy });
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createCaseStudySchema.parse(request.body);
    const caseStudy = await caseStudyService.createCaseStudy(body);
    return reply.status(201).send({ success: true, data: caseStudy });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = createCaseStudySchema.partial().parse(request.body);
    const caseStudy = await caseStudyService.updateCaseStudy(id, body);
    return reply.send({ success: true, data: caseStudy });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await caseStudyService.deleteCaseStudy(id);
    return reply.send({ success: true, message: 'Case study deleted' });
  }

  async publish(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const caseStudy = await caseStudyService.publishCaseStudy(id);
    return reply.send({ success: true, data: caseStudy });
  }

  async unpublish(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const caseStudy = await caseStudyService.unpublishCaseStudy(id);
    return reply.send({ success: true, data: caseStudy });
  }
}

// ════════════════════════════════════════════════════
// News Controller
// ════════════════════════════════════════════════════
export class NewsController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, status, category, search } = request.query as any;
    const result = await newsService.listNews({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
      category,
      search,
    });
    return reply.send({
      success: true,
      data: result.news,
      meta: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 20)),
      },
    });
  }

  async getBySlug(request: FastifyRequest, reply: FastifyReply) {
    const { slug } = request.params as { slug: string };
    const news = await newsService.getNewsBySlug(slug);
    return reply.send({ success: true, data: news });
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const news = await newsService.getNews(id);
    return reply.send({ success: true, data: news });
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createNewsSchema.parse(request.body);
    const news = await newsService.createNews(body);
    return reply.status(201).send({ success: true, data: news });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = createNewsSchema.partial().parse(request.body);
    const news = await newsService.updateNews(id, body);
    return reply.send({ success: true, data: news });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await newsService.deleteNews(id);
    return reply.send({ success: true, message: 'News article deleted' });
  }

  async publish(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const news = await newsService.publishNews(id);
    return reply.send({ success: true, data: news });
  }

  async unpublish(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const news = await newsService.unpublishNews(id);
    return reply.send({ success: true, data: news });
  }
}

// ════════════════════════════════════════════════════
// Blog Controller
// ════════════════════════════════════════════════════
export class BlogController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, status, category, tag, search } = request.query as any;
    const result = await blogService.listBlogs({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
      category,
      tag,
      search,
    });
    return reply.send({
      success: true,
      data: result.blogs,
      meta: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 20)),
      },
    });
  }

  async getBySlug(request: FastifyRequest, reply: FastifyReply) {
    const { slug } = request.params as { slug: string };
    const blog = await blogService.getBlogBySlug(slug);
    return reply.send({ success: true, data: blog });
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const blog = await blogService.getBlog(id);
    return reply.send({ success: true, data: blog });
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createBlogSchema.parse(request.body);
    const blog = await blogService.createBlog(body);
    return reply.status(201).send({ success: true, data: blog });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = createBlogSchema.partial().parse(request.body);
    const blog = await blogService.updateBlog(id, body);
    return reply.send({ success: true, data: blog });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await blogService.deleteBlog(id);
    return reply.send({ success: true, message: 'Blog post deleted' });
  }

  async publish(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const blog = await blogService.publishBlog(id);
    return reply.send({ success: true, data: blog });
  }

  async unpublish(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const blog = await blogService.unpublishBlog(id);
    return reply.send({ success: true, data: blog });
  }
}

// ════════════════════════════════════════════════════
// FAQ Controller
// ════════════════════════════════════════════════════
export class FAQController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, category, isActive } = request.query as any;
    const result = await faqService.listFAQs({
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      category,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
    return reply.send({
      success: true,
      data: result.faqs,
      meta: {
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 50)),
      },
    });
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const faq = await faqService.getFAQ(id);
    return reply.send({ success: true, data: faq });
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createFAQSchema.parse(request.body);
    const faq = await faqService.createFAQ(body);
    return reply.status(201).send({ success: true, data: faq });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = createFAQSchema.partial().parse(request.body);
    const faq = await faqService.updateFAQ(id, body);
    return reply.send({ success: true, data: faq });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await faqService.deleteFAQ(id);
    return reply.send({ success: true, message: 'FAQ deleted' });
  }

  async toggle(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const faq = await faqService.toggleFAQ(id);
    return reply.send({ success: true, data: faq });
  }
}

// ════════════════════════════════════════════════════
// Office Controller
// ════════════════════════════════════════════════════
export class OfficeController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, isActive, city } = request.query as any;
    const result = await officeService.listOffices({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      city,
    });
    return reply.send({
      success: true,
      data: result.offices,
      meta: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 20)),
      },
    });
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const office = await officeService.getOffice(id);
    return reply.send({ success: true, data: office });
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createOfficeSchema.parse(request.body);
    const office = await officeService.createOffice(body);
    return reply.status(201).send({ success: true, data: office });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = createOfficeSchema.partial().parse(request.body);
    const office = await officeService.updateOffice(id, body);
    return reply.send({ success: true, data: office });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await officeService.deleteOffice(id);
    return reply.send({ success: true, message: 'Office deleted' });
  }

  async toggle(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const office = await officeService.toggleOffice(id);
    return reply.send({ success: true, data: office });
  }
}

// ════════════════════════════════════════════════════
// Page Controller
// ════════════════════════════════════════════════════
export class PageController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, status } = request.query as any;
    const result = await pageService.listPages({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
    });
    return reply.send({
      success: true,
      data: result.pages,
      meta: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 20)),
      },
    });
  }

  async getBySlug(request: FastifyRequest, reply: FastifyReply) {
    const { slug } = request.params as { slug: string };
    const pageData = await pageService.getPageBySlug(slug);
    return reply.send({ success: true, data: pageData });
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const pageData = await pageService.getPage(id);
    return reply.send({ success: true, data: pageData });
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createPageSchema.parse(request.body);
    const pageData = await pageService.createPage(body);
    return reply.status(201).send({ success: true, data: pageData });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = createPageSchema.partial().parse(request.body);
    const pageData = await pageService.updatePage(id, body);
    return reply.send({ success: true, data: pageData });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await pageService.deletePage(id);
    return reply.send({ success: true, message: 'Page deleted' });
  }

  async publish(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const pageData = await pageService.publishPage(id);
    return reply.send({ success: true, data: pageData });
  }

  async unpublish(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const pageData = await pageService.unpublishPage(id);
    return reply.send({ success: true, data: pageData });
  }
}

export const caseStudyController = new CaseStudyController();
export const newsController = new NewsController();
export const blogController = new BlogController();
export const faqController = new FAQController();
export const officeController = new OfficeController();
export const pageController = new PageController();
