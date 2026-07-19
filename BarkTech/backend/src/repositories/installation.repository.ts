import { Installation, IInstallation } from '../models/installation.js';

export class InstallationRepository {
  async findById(id: string): Promise<IInstallation | null> {
    return Installation.findById(id).populate('clientId').populate('productId');
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    status?: string;
    clientId?: string;
    engineer?: string;
    search?: string;
  }): Promise<{ installations: IInstallation[]; total: number }> {
    const { page = 1, limit = 20, status, clientId, engineer, search } = filters;
    const query: Record<string, any> = {};

    if (status) query.status = status;
    if (clientId) query.clientId = clientId;
    if (engineer) query.engineer = engineer;
    if (search) {
      query.$or = [
        { machineModel: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { engineer: { $regex: search, $options: 'i' } },
      ];
    }

    const [installations, total] = await Promise.all([
      Installation.find(query)
        .populate('clientId')
        .populate('productId')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Installation.countDocuments(query),
    ]);

    return { installations, total };
  }

  async create(data: Partial<IInstallation>): Promise<IInstallation> {
    return Installation.create(data);
  }

  async update(id: string, data: Partial<IInstallation>): Promise<IInstallation | null> {
    return Installation.findByIdAndUpdate(id, data, { new: true }).populate('clientId').populate('productId');
  }

  async delete(id: string): Promise<boolean> {
    const result = await Installation.findByIdAndDelete(id);
    return !!result;
  }

  async findByClientId(clientId: string): Promise<IInstallation[]> {
    return Installation.find({ clientId })
      .populate('productId')
      .sort({ scheduledDate: -1 });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<IInstallation[]> {
    return Installation.find({
      scheduledDate: { $gte: startDate, $lte: endDate },
    })
      .populate('clientId')
      .populate('productId')
      .sort({ scheduledDate: 1 });
  }
}

export const installationRepository = new InstallationRepository();
