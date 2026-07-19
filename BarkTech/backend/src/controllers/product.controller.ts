import { FastifyRequest, FastifyReply } from 'fastify';
import { productService } from '../services/product.service.js';
import { z } from 'zod';

const productMediaSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
});

const productSpecSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  unit: z.string().optional(),
});

const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  categoryId: z.string().optional(),
  summary: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  models: z.string().optional(),
  media: z.array(productMediaSchema).optional(),
  specs: z.array(productSpecSchema).optional(),
  leadTimeDays: z.string().optional(),
  warrantyMonths: z.number().optional(),
  isFeatured: z.boolean().optional(),
  published: z.boolean().optional(),
  reviewStatus: z.enum(['draft', 'in_review', 'approved', 'rejected']).optional(),
});

export class ProductController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, categoryId, search, isFeatured, published } = request.query as any;
    const result = await productService.listProducts({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      categoryId,
      search,
      isFeatured: isFeatured === 'true' ? true : undefined,
      published: published === 'false' ? false : true,
    });
    return reply.send({
      success: true,
      data: result.products,
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
    const product = await productService.getProduct(id);
    return reply.send({ success: true, data: product });
  }

  async getBySlug(request: FastifyRequest, reply: FastifyReply) {
    const { slug } = request.params as { slug: string };
    const product = await productService.getProductBySlug(slug);
    return reply.send({ success: true, data: product });
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createProductSchema.parse(request.body);
    const product = await productService.createProduct(body);
    return reply.status(201).send({ success: true, data: product });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = createProductSchema.partial().parse(request.body);
    const product = await productService.updateProduct(id, body);
    return reply.send({ success: true, data: product });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await productService.deleteProduct(id);
    return reply.send({ success: true, message: 'Product deleted' });
  }

  // ── Review workflow ──────────────────────────────────
  async submitReview(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const product = await productService.updateProduct(id, { reviewStatus: 'in_review' });
    return reply.send({ success: true, data: product });
  }

  async approve(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const product = await productService.updateProduct(id, { reviewStatus: 'approved' });
    return reply.send({ success: true, data: product });
  }

  async reject(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const product = await productService.updateProduct(id, {
      reviewStatus: 'rejected',
      reviewNotes: body?.notes || '',
    });
    return reply.send({ success: true, data: product });
  }

  // ── Publish/Unpublish ────────────────────────────────
  async publish(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const product = await productService.updateProduct(id, {
      published: true,
      publishedAt: new Date(),
    });
    return reply.send({ success: true, data: product });
  }

  async unpublish(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const product = await productService.updateProduct(id, { published: false });
    return reply.send({ success: true, data: product });
  }

  // ── Specs ────────────────────────────────────────────
  async addSpec(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = z.object({ key: z.string(), value: z.string(), unit: z.string().optional() }).parse(request.body);
    const product = await productService.addSpec(id, body);
    return reply.status(201).send({ success: true, data: product });
  }

  async updateSpec(request: FastifyRequest, reply: FastifyReply) {
    const { id, specId } = request.params as { id: string; specId: string };
    const body = z.object({ key: z.string().optional(), value: z.string().optional(), unit: z.string().optional() }).parse(request.body);
    const product = await productService.updateSpec(id, specId, body);
    return reply.send({ success: true, data: product });
  }

  async deleteSpec(request: FastifyRequest, reply: FastifyReply) {
    const { id, specId } = request.params as { id: string; specId: string };
    await productService.deleteSpec(id, specId);
    return reply.send({ success: true, message: 'Spec deleted' });
  }

  // ── Categories ──────────────────────────────────────
  async listCategories(request: FastifyRequest, reply: FastifyReply) {
    const categories = await productService.listCategories();
    return reply.send({ success: true, data: categories });
  }

  async createCategory(request: FastifyRequest, reply: FastifyReply) {
    const body = z.object({ name: z.string(), slug: z.string(), description: z.string().optional() }).parse(request.body);
    const category = await productService.createCategory(body);
    return reply.status(201).send({ success: true, data: category });
  }
}

export const productController = new ProductController();
