import { FastifyRequest, FastifyReply } from 'fastify';
import { ContentPost } from '../models/contentPost.js';

export const contentPostController = {
  // List content posts with filtering
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { postType, status, limit = 20, offset = 0 } = request.query as any;
      const filter: any = {};

      if (postType) filter.postType = postType;
      if (status) filter.reviewStatus = status;

      const posts = await ContentPost.find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit));

      const total = await ContentPost.countDocuments(filter);

      return reply.send({ success: true, data: posts, total });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  },

  // Get content post by ID
  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const post = await ContentPost.findById(id);

      if (!post) {
        return reply.status(404).send({ success: false, error: 'Content post not found' });
      }

      return reply.send({ success: true, data: post });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  },

  // Create content post
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = request.body as any;
      const user = (request as any).user;

      const post = new ContentPost({
        ...data,
        createdBy: user?.id || null,
      });

      await post.save();

      return reply.status(201).send({ success: true, data: post });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  },

  // Update content post
  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const data = request.body as any;

      const post = await ContentPost.findByIdAndUpdate(id, data, { new: true, runValidators: true });

      if (!post) {
        return reply.status(404).send({ success: false, error: 'Content post not found' });
      }

      return reply.send({ success: true, data: post });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  },

  // Delete content post
  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const post = await ContentPost.findByIdAndDelete(id);

      if (!post) {
        return reply.status(404).send({ success: false, error: 'Content post not found' });
      }

      return reply.send({ success: true, message: 'Content post deleted' });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  },

  // Submit for review
  async submitForReview(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;

      const post = await ContentPost.findByIdAndUpdate(
        id,
        { reviewStatus: 'in_review', reviewedBy: user?.id },
        { new: true }
      );

      if (!post) {
        return reply.status(404).send({ success: false, error: 'Content post not found' });
      }

      return reply.send({ success: true, data: post });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  },

  // Approve content post
  async approve(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const { reviewNotes } = request.body as any;
      const user = (request as any).user;

      const post = await ContentPost.findByIdAndUpdate(
        id,
        {
          reviewStatus: 'approved',
          reviewNotes,
          reviewedBy: user?.id,
          reviewedAt: new Date(),
        },
        { new: true }
      );

      if (!post) {
        return reply.status(404).send({ success: false, error: 'Content post not found' });
      }

      return reply.send({ success: true, data: post });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  },

  // Reject content post
  async reject(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const { reviewNotes } = request.body as any;
      const user = (request as any).user;

      const post = await ContentPost.findByIdAndUpdate(
        id,
        {
          reviewStatus: 'rejected',
          reviewNotes,
          reviewedBy: user?.id,
          reviewedAt: new Date(),
        },
        { new: true }
      );

      if (!post) {
        return reply.status(404).send({ success: false, error: 'Content post not found' });
      }

      return reply.send({ success: true, data: post });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  },
};
