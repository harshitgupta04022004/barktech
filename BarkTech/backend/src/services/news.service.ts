import { newsRepository } from '../repositories/news.repository.js';
import { AppError } from '../utils/errors.js';

export class NewsService {
  async getNews(id: string) {
    const news = await newsRepository.findById(id);
    if (!news) throw new AppError('News article not found', 404);
    return news;
  }

  async getNewsBySlug(slug: string) {
    const news = await newsRepository.findBySlug(slug);
    if (!news) throw new AppError('News article not found', 404);
    return news;
  }

  async listNews(filters: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  }) {
    return newsRepository.findAll(filters);
  }

  async createNews(data: any) {
    if (data.status === 'published' && !data.publishedAt) {
      data.publishedAt = new Date();
    }
    return newsRepository.create(data);
  }

  async updateNews(id: string, data: any) {
    if (data.status === 'published' && !data.publishedAt) {
      data.publishedAt = new Date();
    }
    const news = await newsRepository.update(id, data);
    if (!news) throw new AppError('News article not found', 404);
    return news;
  }

  async deleteNews(id: string) {
    const deleted = await newsRepository.delete(id);
    if (!deleted) throw new AppError('News article not found', 404);
  }

  async publishNews(id: string) {
    const news = await newsRepository.update(id, {
      status: 'published',
      publishedAt: new Date(),
    });
    if (!news) throw new AppError('News article not found', 404);
    return news;
  }

  async unpublishNews(id: string) {
    const news = await newsRepository.update(id, {
      status: 'draft',
    });
    if (!news) throw new AppError('News article not found', 404);
    return news;
  }
}

export const newsService = new NewsService();
