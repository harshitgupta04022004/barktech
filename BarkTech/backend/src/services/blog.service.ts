import { blogRepository } from '../repositories/blog.repository.js';
import { AppError } from '../utils/errors.js';

export class BlogService {
  async getBlog(id: string) {
    const blog = await blogRepository.findById(id);
    if (!blog) throw new AppError('Blog post not found', 404);
    return blog;
  }

  async getBlogBySlug(slug: string) {
    const blog = await blogRepository.findBySlug(slug);
    if (!blog) throw new AppError('Blog post not found', 404);
    return blog;
  }

  async listBlogs(filters: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    tag?: string;
    search?: string;
  }) {
    return blogRepository.findAll(filters);
  }

  async createBlog(data: any) {
    if (!data.readTime && data.content) {
      data.readTime = Math.ceil(data.content.split(/\s+/).length / 200);
    }
    if (data.status === 'published' && !data.publishedAt) {
      data.publishedAt = new Date();
    }
    return blogRepository.create(data);
  }

  async updateBlog(id: string, data: any) {
    if (!data.readTime && data.content) {
      data.readTime = Math.ceil(data.content.split(/\s+/).length / 200);
    }
    if (data.status === 'published' && !data.publishedAt) {
      data.publishedAt = new Date();
    }
    const blog = await blogRepository.update(id, data);
    if (!blog) throw new AppError('Blog post not found', 404);
    return blog;
  }

  async deleteBlog(id: string) {
    const deleted = await blogRepository.delete(id);
    if (!deleted) throw new AppError('Blog post not found', 404);
  }

  async publishBlog(id: string) {
    const blog = await blogRepository.update(id, {
      status: 'published',
      publishedAt: new Date(),
    });
    if (!blog) throw new AppError('Blog post not found', 404);
    return blog;
  }

  async unpublishBlog(id: string) {
    const blog = await blogRepository.update(id, {
      status: 'draft',
    });
    if (!blog) throw new AppError('Blog post not found', 404);
    return blog;
  }
}

export const blogService = new BlogService();
