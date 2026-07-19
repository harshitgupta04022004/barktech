import { caseStudyRepository } from '../repositories/caseStudy.repository.js';
import { AppError } from '../utils/errors.js';

export class CaseStudyService {
  async getCaseStudy(id: string) {
    const caseStudy = await caseStudyRepository.findById(id);
    if (!caseStudy) throw new AppError('Case study not found', 404);
    return caseStudy;
  }

  async getCaseStudyBySlug(slug: string) {
    const caseStudy = await caseStudyRepository.findBySlug(slug);
    if (!caseStudy) throw new AppError('Case study not found', 404);
    return caseStudy;
  }

  async listCaseStudies(filters: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    tag?: string;
  }) {
    return caseStudyRepository.findAll(filters);
  }

  async createCaseStudy(data: any) {
    if (data.published && !data.publishedAt) {
      data.publishedAt = new Date();
    }
    return caseStudyRepository.create(data);
  }

  async updateCaseStudy(id: string, data: any) {
    if (data.published && !data.publishedAt) {
      data.publishedAt = new Date();
    }
    const caseStudy = await caseStudyRepository.update(id, data);
    if (!caseStudy) throw new AppError('Case study not found', 404);
    return caseStudy;
  }

  async deleteCaseStudy(id: string) {
    const deleted = await caseStudyRepository.delete(id);
    if (!deleted) throw new AppError('Case study not found', 404);
  }

  async publishCaseStudy(id: string) {
    const caseStudy = await caseStudyRepository.update(id, {
      published: true,
      publishedAt: new Date(),
    });
    if (!caseStudy) throw new AppError('Case study not found', 404);
    return caseStudy;
  }

  async unpublishCaseStudy(id: string) {
    const caseStudy = await caseStudyRepository.update(id, {
      published: false,
    });
    if (!caseStudy) throw new AppError('Case study not found', 404);
    return caseStudy;
  }
}

export const caseStudyService = new CaseStudyService();
