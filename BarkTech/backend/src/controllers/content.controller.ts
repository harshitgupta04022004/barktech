import { FastifyRequest, FastifyReply } from 'fastify';
import { ContentPost } from '../models/contentPost.js';
import { BlogPost } from '../models/blogPost.js';
import { NewsArticle } from '../models/newsArticle.js';
import { CaseStudy } from '../models/caseStudy.js';
import crypto from 'crypto';

type ContentType = 'blog' | 'news' | 'case_study' | 'installation' | 'general';

interface ContentListItem {
  _id: string;
  contentType: ContentType;
  title: string;
  excerpt?: string;
  body?: string;
  imageUrl?: string;
  reviewStatus: string;
  reviewNotes?: string;
  productId?: string;
  pageSlug?: string;
  createdAt: Date;
  updatedAt: Date;
}

function normalizeContent(doc: any, contentType: ContentType): ContentListItem {
  return {
    _id: doc._id?.toString() || doc.id,
    contentType,
    title: doc.title || '',
    excerpt: doc.excerpt || doc.summary || undefined,
    body: doc.content || doc.contentText || undefined,
    imageUrl: doc.imageUrl || doc.coverImageUrl || undefined,
    reviewStatus: doc.reviewStatus || doc.status || 'draft',
    reviewNotes: doc.reviewNotes || undefined,
    productId: doc.productId?.toString() || undefined,
    pageSlug: doc.pageSlug || undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
}

export const contentController = {
  // LIST - unified across all content types
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const {
        type,
        reviewStatus,
        dateFrom,
        dateTo,
        productId,
        search,
        limit = 50,
        offset = 0,
      } = request.query as any;

      const filter: any = {};
      if (reviewStatus) filter.reviewStatus = reviewStatus;
      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
      }

      const types: ContentType[] = type
        ? [type]
        : ['blog', 'news', 'case_study', 'general'];

      const allItems: ContentListItem[] = [];

      for (const ct of types) {
        let items: any[] = [];
        if (ct === 'blog') {
          const q: any = { ...filter };
          if (productId) q.productId = productId;
          if (search) q.title = { $regex: search, $options: 'i' };
          items = await BlogPost.find(q).sort({ createdAt: -1 });
        } else if (ct === 'news') {
          const q: any = { ...filter };
          if (search) q.title = { $regex: search, $options: 'i' };
          items = await NewsArticle.find(q).sort({ createdAt: -1 });
        } else if (ct === 'case_study') {
          const q: any = { ...filter };
          if (search) q.title = { $regex: search, $options: 'i' };
          items = await CaseStudy.find(q).sort({ createdAt: -1 });
        } else if (ct === 'general') {
          const q: any = { ...filter, postType: 'general' };
          if (productId) q.productId = productId;
          if (search) q.title = { $regex: search, $options: 'i' };
          items = await ContentPost.find(q).sort({ createdAt: -1 });
        }
        allItems.push(...items.map((d: any) => normalizeContent(d, ct)));
      }

      const statusOrder: Record<string, number> = {
        in_review: 0,
        rejected: 1,
        draft: 2,
        approved: 3,
      };
      allItems.sort((a, b) => {
        const sa = statusOrder[a.reviewStatus] ?? 4;
        const sb = statusOrder[b.reviewStatus] ?? 4;
        if (sa !== sb) return sa - sb;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const total = allItems.length;
      const paginated = allItems.slice(Number(offset), Number(offset) + Number(limit));

      return reply.send({ success: true, data: paginated, total });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  },

  // GET BY ID - searches across all content collections
  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;

      let doc = await BlogPost.findById(id);
      if (doc) return reply.send({ success: true, data: normalizeContent(doc, 'blog'), contentType: 'blog' });

      doc = await NewsArticle.findById(id) as any;
      if (doc) return reply.send({ success: true, data: normalizeContent(doc, 'news'), contentType: 'news' });

      doc = await CaseStudy.findById(id) as any;
      if (doc) return reply.send({ success: true, data: normalizeContent(doc, 'case_study'), contentType: 'case_study' });

      const contentPost = await ContentPost.findById(id);
      if (contentPost) {
        return reply.send({
          success: true,
          data: normalizeContent(contentPost, 'general'),
          contentType: 'general',
        });
      }

      return reply.status(404).send({ success: false, error: 'Content not found' });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  },

  // CREATE - routes to correct collection based on contentType
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = request.body as any;
      const user = (request as any).user;
      const contentType: ContentType = data.contentType || 'general';

      if (contentType === 'installation' && !data.productId) {
        return reply.status(400).send({
          success: false,
          error: 'Installation content requires a product_id',
        });
      }

      if (!data.productId && !data.pageSlug && contentType !== 'installation') {
        if (data.reviewStatus === 'in_review' || data.reviewStatus === 'approved') {
          return reply.status(400).send({
            success: false,
            error: 'Published posts need a link target — provide a product_id or page_slug.',
          });
        }
      }

      let doc: any;

      switch (contentType) {
        case 'blog': {
          doc = await BlogPost.create({
            title: data.title,
            slug: data.slug || generateSlug(data.title || 'untitled'),
            excerpt: data.excerpt,
            content: data.content || data.body,
            authorId: user?.id || null,
            imageUrl: data.imageUrl,
            tags: data.tags,
            productId: data.productId || null,
            pageSlug: data.pageSlug || null,
            reviewStatus: data.reviewStatus || 'draft',
          });
          break;
        }
        case 'news': {
          doc = await NewsArticle.create({
            title: data.title,
            slug: data.slug || generateSlug(data.title || 'untitled'),
            newsType: data.newsType || 'company',
            excerpt: data.excerpt,
            content: data.content || data.body,
            coverImageUrl: data.imageUrl || data.coverImageUrl,
            sourceUrl: data.sourceUrl,
            authorId: user?.id || null,
            tags: data.tags,
            pageSlug: data.pageSlug || null,
            reviewStatus: data.reviewStatus || 'draft',
          });
          break;
        }
        case 'case_study': {
          doc = await CaseStudy.create({
            title: data.title,
            slug: data.slug || generateSlug(data.title || 'untitled'),
            clientName: data.clientName,
            location: data.location,
            industry: data.industry,
            summary: data.excerpt || data.summary,
            content: data.content || data.body,
            imageUrl: data.imageUrl,
            pageSlug: data.pageSlug || null,
            reviewStatus: data.reviewStatus || 'draft',
          });
          break;
        }
        default: {
          const contentHash = data.title && (data.content || data.contentText)
            ? crypto.createHash('sha256')
                .update((data.title + (data.content || data.contentText)).toLowerCase().replace(/\s+/g, ' ').trim())
                .digest('hex')
            : undefined;

          doc = await ContentPost.create({
            postType: data.postType || (contentType === 'installation' ? 'installation_complete' : 'general'),
            title: data.title,
            contentText: data.content || data.contentText || '',
            linkUrl: data.linkUrl,
            hashtags: data.hashtags,
            productId: data.productId || null,
            installationId: data.installationId || null,
            newsArticleId: data.newsArticleId || null,
            caseStudyId: data.caseStudyId || null,
            blogPostId: data.blogPostId || null,
            pageSlug: data.pageSlug || null,
            contentHash,
            scheduledAt: data.scheduledAt || null,
            createdVia: data.createdVia || 'admin_form',
            reviewStatus: data.reviewStatus || 'draft',
            createdBy: user?.id || null,
          });
          break;
        }
      }

      return reply.status(201).send({ success: true, data: doc, contentType });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  },

  // UPDATE
  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const data = request.body as any;
      const contentType: ContentType = data.contentType || 'general';
      const user = (request as any).user;

      let doc: any;

      switch (contentType) {
        case 'blog':
          doc = await BlogPost.findByIdAndUpdate(id, data, { new: true, runValidators: true });
          break;
        case 'news':
          doc = await NewsArticle.findByIdAndUpdate(id, data, { new: true, runValidators: true });
          break;
        case 'case_study':
          doc = await CaseStudy.findByIdAndUpdate(id, data, { new: true, runValidators: true });
          break;
        default:
          doc = await ContentPost.findByIdAndUpdate(id, data, { new: true, runValidators: true });
          break;
      }

      if (!doc) {
        return reply.status(404).send({ success: false, error: 'Content not found' });
      }

      return reply.send({ success: true, data: doc });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  },

  // DELETE
  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;

      let doc = await BlogPost.findByIdAndDelete(id);
      if (doc) {
        return reply.send({ success: true, message: 'Blog post deleted' });
      }

      doc = await NewsArticle.findByIdAndDelete(id) as any;
      if (doc) {
        return reply.send({ success: true, message: 'News article deleted' });
      }

      doc = await CaseStudy.findByIdAndDelete(id) as any;
      if (doc) {
        return reply.send({ success: true, message: 'Case study deleted' });
      }

      const contentPost = await ContentPost.findByIdAndDelete(id);
      if (contentPost) {
        return reply.send({ success: true, message: 'Content post deleted' });
      }

      return reply.status(404).send({ success: false, error: 'Content not found' });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  },

  // REVIEW - generic status transition
  async review(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const { status, reason } = request.body as any;
      const user = (request as any).user;

      const allowed = ['draft', 'in_review', 'approved', 'rejected'];
      if (!allowed.includes(status)) {
        return reply.status(400).send({ success: false, error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
      }

      if (status === 'rejected' && !reason) {
        return reply.status(400).send({ success: false, error: 'Rejection requires a reason' });
      }

      const updateData = {
        reviewStatus: status,
        reviewNotes: reason || undefined,
        reviewedBy: user?.id,
        reviewedAt: new Date(),
      };

      let doc = await BlogPost.findByIdAndUpdate(id, updateData, { new: true });
      if (doc) return reply.send({ success: true, data: doc, contentType: 'blog' });

      doc = await NewsArticle.findByIdAndUpdate(id, updateData, { new: true }) as any;
      if (doc) return reply.send({ success: true, data: doc, contentType: 'news' });

      doc = await CaseStudy.findByIdAndUpdate(id, updateData, { new: true }) as any;
      if (doc) return reply.send({ success: true, data: doc, contentType: 'case_study' });

      const contentPost = await ContentPost.findByIdAndUpdate(id, updateData, { new: true });
      if (contentPost) return reply.send({ success: true, data: contentPost, contentType: 'general' });

      return reply.status(404).send({ success: false, error: 'Content not found' });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  },

  // APPROVE - shortcut
  async approve(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const { reviewNotes } = request.body as any;
      const user = (request as any).user;

      const updateData = {
        reviewStatus: 'approved',
        reviewNotes,
        reviewedBy: user?.id,
        reviewedAt: new Date(),
      };

      let doc = await BlogPost.findByIdAndUpdate(id, updateData, { new: true });
      if (doc) {
        return reply.send({ success: true, data: doc, contentType: 'blog' });
      }

      doc = await NewsArticle.findByIdAndUpdate(id, updateData, { new: true }) as any;
      if (doc) {
        return reply.send({ success: true, data: doc, contentType: 'news' });
      }

      doc = await CaseStudy.findByIdAndUpdate(id, updateData, { new: true }) as any;
      if (doc) {
        return reply.send({ success: true, data: doc, contentType: 'case_study' });
      }

      const contentPost = await ContentPost.findByIdAndUpdate(id, updateData, { new: true });
      if (contentPost) {
        return reply.send({ success: true, data: contentPost, contentType: 'general' });
      }

      return reply.status(404).send({ success: false, error: 'Content not found' });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  },

  // REJECT - requires reason
  async reject(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const { reason } = request.body as any;
      const user = (request as any).user;

      if (!reason) {
        return reply.status(400).send({ success: false, error: 'Rejection reason is required' });
      }

      const updateData = {
        reviewStatus: 'rejected',
        reviewNotes: reason,
        reviewedBy: user?.id,
        reviewedAt: new Date(),
      };

      let doc = await BlogPost.findByIdAndUpdate(id, updateData, { new: true });
      if (doc) {
        return reply.send({ success: true, data: doc, contentType: 'blog' });
      }

      doc = await NewsArticle.findByIdAndUpdate(id, updateData, { new: true }) as any;
      if (doc) {
        return reply.send({ success: true, data: doc, contentType: 'news' });
      }

      doc = await CaseStudy.findByIdAndUpdate(id, updateData, { new: true }) as any;
      if (doc) {
        return reply.send({ success: true, data: doc, contentType: 'case_study' });
      }

      const contentPost = await ContentPost.findByIdAndUpdate(id, updateData, { new: true });
      if (contentPost) {
        return reply.send({ success: true, data: contentPost, contentType: 'general' });
      }

      return reply.status(404).send({ success: false, error: 'Content not found' });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  },

  // PUBLISH - trigger social media publishing
  async publish(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const { platforms = ['facebook', 'instagram', 'linkedin', 'twitter'] } = request.body as any;

      // Find the content post
      const contentPost = await ContentPost.findById(id);
      if (!contentPost) {
        return reply.status(404).send({ success: false, error: 'Content post not found' });
      }

      if (contentPost.reviewStatus !== 'approved') {
        return reply.status(400).send({ success: false, error: 'Content must be approved before publishing' });
      }

      // Import scheduler service dynamically to avoid circular dependencies
      const { schedulerService } = await import('../services/scheduler.service.js');
      await schedulerService.enqueuePublish(id, platforms);

      return reply.send({
        success: true,
        message: 'Content queued for publishing',
        platforms,
      });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  },

  // PUBLISH STATUS - check publishing status for a content item
  async publishStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;

      const { SocialPublishLog } = await import('../models/socialPublishLog.js');
      const logs = await SocialPublishLog.find({ contentPostId: id }).sort({ createdAt: -1 });

      const statusByPlatform: Record<string, any> = {};
      for (const log of logs) {
        if (!statusByPlatform[log.platform]) {
          statusByPlatform[log.platform] = log;
        }
      }

      return reply.send({
        success: true,
        data: {
          contentPostId: id,
          platforms: statusByPlatform,
          totalAttempts: logs.length,
        },
      });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  },
};
