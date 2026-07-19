import { aiModelRepository } from '../repositories/aiModel.repository.js';
import { AppError } from '../utils/errors.js';
import type { IAIModel } from '../models/aiModel.js';

export class AIModelService {
  async listModels(role?: string) {
    const filters: any = {};
    if (role) filters.role = role;
    return aiModelRepository.findAll(filters);
  }

  async getModel(id: string) {
    const model = await aiModelRepository.findById(id);
    if (!model) throw new AppError('AI model not found', 404);
    return model;
  }

  async getDefaultModel(role: string) {
    return aiModelRepository.getDefault(role);
  }

  async createModel(data: Partial<IAIModel>) {
    if (!data.name || !data.modelId || !data.role) {
      throw new AppError('name, modelId, and role are required', 400);
    }
    const existing = await aiModelRepository.findByModelId(data.modelId);
    if (existing) {
      throw new AppError(`Model "${data.modelId}" already exists`, 409);
    }
    return aiModelRepository.create(data);
  }

  async updateModel(id: string, data: Partial<IAIModel>) {
    const model = await aiModelRepository.findById(id);
    if (!model) throw new AppError('AI model not found', 404);

    if (data.modelId && data.modelId !== model.modelId) {
      const existing = await aiModelRepository.findByModelId(data.modelId);
      if (existing) {
        throw new AppError(`Model "${data.modelId}" already exists`, 409);
      }
    }
    return aiModelRepository.update(id, data);
  }

  async deleteModel(id: string) {
    const model = await aiModelRepository.findById(id);
    if (!model) throw new AppError('AI model not found', 404);
    if (model.isDefault) {
      throw new AppError('Cannot delete the default model. Set another model as default first.', 400);
    }
    return aiModelRepository.delete(id);
  }

  async setDefault(id: string) {
    const model = await aiModelRepository.findById(id);
    if (!model) throw new AppError('AI model not found', 404);
    await aiModelRepository.setDefault(id, model.role);
    return { success: true };
  }

  async toggleActive(id: string) {
    const model = await aiModelRepository.findById(id);
    if (!model) throw new AppError('AI model not found', 404);
    if (model.isDefault && model.isActive) {
      throw new AppError('Cannot deactivate the default model. Set another model as default first.', 400);
    }
    return aiModelRepository.update(id, { isActive: !model.isActive });
  }

  async seedDefaults() {
    await aiModelRepository.seedDefaults();
  }
}

export const aiModelService = new AIModelService();
