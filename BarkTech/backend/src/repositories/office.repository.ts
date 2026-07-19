import { Office, IOffice } from '../models/office.js';

export class OfficeRepository {
  async findById(id: string): Promise<IOffice | null> {
    return Office.findById(id);
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    city?: string;
  }): Promise<{ offices: IOffice[]; total: number }> {
    const { page = 1, limit = 20, isActive = true, city } = filters;
    const query: Record<string, any> = {};

    if (isActive !== undefined) query.isActive = isActive;
    if (city) query.city = city;

    const [offices, total] = await Promise.all([
      Office.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Office.countDocuments(query),
    ]);

    return { offices, total };
  }

  async create(data: Partial<IOffice>): Promise<IOffice> {
    return Office.create(data);
  }

  async update(id: string, data: Partial<IOffice>): Promise<IOffice | null> {
    return Office.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await Office.findByIdAndDelete(id);
    return !!result;
  }
}

export const officeRepository = new OfficeRepository();
