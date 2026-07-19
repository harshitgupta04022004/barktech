import { AIModel, IAIModel } from '../models/aiModel.js';

export class AIModelRepository {
  async findAll(filters: { role?: string; isActive?: boolean } = {}): Promise<IAIModel[]> {
    const query: any = {};
    if (filters.role) query.role = filters.role;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    return AIModel.find(query).sort({ isDefault: -1, createdAt: -1 });
  }

  async findById(id: string): Promise<IAIModel | null> {
    return AIModel.findById(id);
  }

  async findByModelId(modelId: string): Promise<IAIModel | null> {
    return AIModel.findOne({ modelId });
  }

  async getDefault(role: string): Promise<IAIModel | null> {
    return AIModel.findOne({ role, isDefault: true, isActive: true });
  }

  async create(data: Partial<IAIModel>): Promise<IAIModel> {
    return AIModel.create(data);
  }

  async update(id: string, data: Partial<IAIModel>): Promise<IAIModel | null> {
    return AIModel.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<IAIModel | null> {
    return AIModel.findByIdAndDelete(id);
  }

  async setDefault(id: string, role: string): Promise<void> {
    await AIModel.updateMany({ role }, { isDefault: false });
    await AIModel.findByIdAndUpdate(id, { isDefault: true });
  }

  async count(): Promise<number> {
    return AIModel.countDocuments();
  }

  async seedDefaults(): Promise<void> {
    const count = await this.count();
    if (count > 0) return;

    const defaults = [
      {
        name: 'DeepSeek V4 Flash',
        modelId: 'deepseek/deepseek-v4-flash',
        provider: 'openrouter',
        description: 'Fast and affordable — great for customer-facing queries',
        isActive: true,
        isDefault: true,
        role: 'client',
        maxTokens: 1024,
        temperature: 0.3,
      },
      {
        name: 'MiMo V2.5',
        modelId: 'xiaomi/mimo-v2.5',
        provider: 'openrouter',
        description: 'Powerful reasoning — used for admin operations',
        isActive: true,
        isDefault: true,
        role: 'admin',
        maxTokens: 2048,
        temperature: 0.2,
      },
    ];

    for (const model of defaults) {
      await AIModel.create(model);
    }
  }
}

export const aiModelRepository = new AIModelRepository();
