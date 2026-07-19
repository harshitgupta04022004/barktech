import { leadRepository } from '../repositories/lead.repository.js';
import { AppError } from '../utils/errors.js';

export class LeadService {
  async getLead(id: string) {
    const lead = await leadRepository.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);
    return lead;
  }

  async listLeads(filters: { page?: number; limit?: number; status?: string; priority?: string }) {
    return leadRepository.findAll(filters);
  }

  async createLead(data: any) {
    return leadRepository.create(data);
  }

  async updateLead(id: string, data: any) {
    const lead = await leadRepository.update(id, data);
    if (!lead) throw new AppError('Lead not found', 404);
    return lead;
  }

  async getStats() {
    return leadRepository.getStats();
  }
}

export const leadService = new LeadService();
