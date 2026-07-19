import { installationRepository } from '../repositories/installation.repository.js';
import { AppError } from '../utils/errors.js';

export class InstallationService {
  async getInstallation(id: string) {
    const installation = await installationRepository.findById(id);
    if (!installation) throw new AppError('Installation not found', 404);
    return installation;
  }

  async listInstallations(filters: {
    page?: number;
    limit?: number;
    status?: string;
    clientId?: string;
    engineer?: string;
    search?: string;
  }) {
    return installationRepository.findAll(filters);
  }

  async createInstallation(data: any) {
    if (new Date(data.scheduledDate) < new Date()) {
      throw new AppError('Scheduled date cannot be in the past', 400);
    }
    return installationRepository.create(data);
  }

  async updateInstallation(id: string, data: any) {
    const installation = await installationRepository.update(id, data);
    if (!installation) throw new AppError('Installation not found', 404);
    return installation;
  }

  async deleteInstallation(id: string) {
    const deleted = await installationRepository.delete(id);
    if (!deleted) throw new AppError('Installation not found', 404);
  }

  async startInstallation(id: string) {
    const installation = await installationRepository.update(id, {
      status: 'in-progress',
    });
    if (!installation) throw new AppError('Installation not found', 404);
    return installation;
  }

  async completeInstallation(id: string, completedDate?: Date) {
    const installation = await installationRepository.update(id, {
      status: 'completed',
      completedDate: completedDate || new Date(),
    });
    if (!installation) throw new AppError('Installation not found', 404);
    return installation;
  }

  async rescheduleInstallation(id: string, newDate: Date) {
    if (new Date(newDate) < new Date()) {
      throw new AppError('Scheduled date cannot be in the past', 400);
    }
    const installation = await installationRepository.update(id, {
      scheduledDate: newDate,
    });
    if (!installation) throw new AppError('Installation not found', 404);
    return installation;
  }

  async addPhoto(id: string, photoData: { url: string; caption?: string; takenAt?: Date }) {
    const installation = await installationRepository.findById(id);
    if (!installation) throw new AppError('Installation not found', 404);
    installation.photos.push(photoData as any);
    await installation.save();
    return installation;
  }

  async getClientInstallations(clientId: string) {
    return installationRepository.findByClientId(clientId);
  }

  async getInstallationsByDateRange(startDate: string, endDate: string) {
    return installationRepository.findByDateRange(new Date(startDate), new Date(endDate));
  }
}

export const installationService = new InstallationService();
