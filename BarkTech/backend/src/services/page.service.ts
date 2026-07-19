import { pageRepository } from '../repositories/page.repository.js';
import { AppError } from '../utils/errors.js';

export class PageService {
  async getPage(id: string) {
    const page = await pageRepository.findById(id);
    if (!page) throw new AppError('Page not found', 404);
    return page;
  }

  async getPageBySlug(slug: string) {
    const page = await pageRepository.findBySlug(slug);
    if (!page) throw new AppError('Page not found', 404);
    return page;
  }

  async listPages(filters: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    return pageRepository.findAll(filters);
  }

  async createPage(data: any) {
    return pageRepository.create(data);
  }

  async updatePage(id: string, data: any) {
    const page = await pageRepository.update(id, data);
    if (!page) throw new AppError('Page not found', 404);
    return page;
  }

  async deletePage(id: string) {
    const deleted = await pageRepository.delete(id);
    if (!deleted) throw new AppError('Page not found', 404);
  }

  async publishPage(id: string) {
    const page = await pageRepository.update(id, { published: true });
    if (!page) throw new AppError('Page not found', 404);
    return page;
  }

  async unpublishPage(id: string) {
    const page = await pageRepository.update(id, { published: false });
    if (!page) throw new AppError('Page not found', 404);
    return page;
  }
}

export const pageService = new PageService();
