import { officeRepository } from '../repositories/office.repository.js';
import { AppError } from '../utils/errors.js';

export class OfficeService {
  async getOffice(id: string) {
    const office = await officeRepository.findById(id);
    if (!office) throw new AppError('Office not found', 404);
    return office;
  }

  async listOffices(filters: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    city?: string;
  }) {
    return officeRepository.findAll(filters);
  }

  async createOffice(data: any) {
    return officeRepository.create(data);
  }

  async updateOffice(id: string, data: any) {
    const office = await officeRepository.update(id, data);
    if (!office) throw new AppError('Office not found', 404);
    return office;
  }

  async deleteOffice(id: string) {
    const deleted = await officeRepository.delete(id);
    if (!deleted) throw new AppError('Office not found', 404);
  }

  async toggleOffice(id: string) {
    const office = await officeRepository.findById(id);
    if (!office) throw new AppError('Office not found', 404);
    const updated = await officeRepository.update(id, { isActive: !office.isActive });
    return updated;
  }
}

export const officeService = new OfficeService();
