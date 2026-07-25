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

async function callAgentEnhancement(productId: string, name: string, description: string, shortDescription: string, categoryName: string, models: string, fileDescriptions: string): Promise<any> {
  try {
    const agentUrl = process.env.AGENT_URL || 'http://localhost:8000';
    const response = await fetch(`${agentUrl}/agent/enhance-product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        name,
        description,
        short_description: shortDescription,
        category_name: categoryName,
        models,
        file_descriptions: fileDescriptions,
      }),
    });
    if (!response.ok) {
      console.error('Agent enhancement failed:', response.status);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error('Agent enhancement error:', err);
    return null;
  }
}

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

  // ── AI-enhanced product creation with file upload ──────
  async createWithAI(request: FastifyRequest, reply: FastifyReply) {
    const files: any[] = [];
    const mediaUrls: { url: string; alt?: string }[] = [];
    const fileDescriptions: string[] = [];

    // Handle multipart file uploads
    const parts = request.parts();
    let formData: any = {};

    for await (const part of parts) {
      if (part.type === 'file') {
        // Collect file info for the agent
        const filename = part.filename;
        const mimetype = part.mimetype;
        const isImage = mimetype.startsWith('image/');
        const isVideo = mimetype.startsWith('video/');
        const isDocument = mimetype === 'application/pdf' || mimetype.startsWith('text/');

        fileDescriptions.push(`[${isImage ? 'Image' : isVideo ? 'Video' : 'Document'}: ${filename} (${mimetype})]`);

        // For images, try to save to a temp location or note them
        if (isImage) {
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          // Store file info — actual S3 upload happens via presigned URL from frontend
          // For now, we store the media URL from the form field if provided
        }
      } else {
        // Regular form fields
        const value = await part.value;
        formData[part.fieldname] = value;
      }
    }

    // Parse media URLs from form data (frontend uploads to S3 first, then sends URLs)
    if (formData.media) {
      try {
        const parsed = JSON.parse(formData.media);
        if (Array.isArray(parsed)) {
          mediaUrls.push(...parsed);
        }
      } catch {
        // media might be a single URL string
        if (formData.media.startsWith('http')) {
          mediaUrls.push({ url: formData.media });
        }
      }
    }

    // Create the product with basic data first
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const productData: any = {
      name: formData.name,
      slug,
      summary: formData.shortDescription || formData.description || '',
      shortDescription: formData.shortDescription || '',
      description: formData.description || '',
      models: formData.models || '',
      categoryId: formData.categoryId || undefined,
      media: mediaUrls,
      leadTimeDays: formData.leadTimeDays || undefined,
      warrantyMonths: formData.warrantyMonths ? Number(formData.warrantyMonths) : undefined,
      isFeatured: formData.isFeatured === 'true',
      published: false,
      reviewStatus: 'draft',
    };

    const product = await productService.createProduct(productData);

    // Trigger AI enhancement in background (non-blocking)
    const productId = (product as any)._id.toString();
    const categoryName = formData.categoryName || '';

    callAgentEnhancement(
      productId,
      formData.name,
      formData.description || '',
      formData.shortDescription || '',
      categoryName,
      formData.models || '',
      fileDescriptions.join('\n'),
    ).catch((err) => {
      console.error('Background AI enhancement failed:', err);
    });

    return reply.status(201).send({
      success: true,
      data: product,
      aiEnhancement: 'triggered',
      message: 'Product created. AI is enhancing the listing with professional details.',
    });
  }
}

export const productController = new ProductController();
