import mongoose from 'mongoose';
import { Stock, IStock } from '../models/stock.js';

export class StockRepository {
  async findById(id: string): Promise<IStock | null> {
    return Stock.findById(id).populate('productId');
  }

  async findByProductId(productId: string): Promise<IStock | null> {
    return Stock.findOne({ productId }).populate('productId');
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    search?: string;
    lowStockOnly?: boolean;
  }): Promise<{ stocks: IStock[]; total: number }> {
    const { page = 1, limit = 20, search, lowStockOnly } = filters;
    const query: Record<string, any> = {};

    if (lowStockOnly) {
      query.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
    }

    if (search) {
      query.$text = { $search: search };
    }

    const [stocks, total] = await Promise.all([
      Stock.find(query)
        .populate('productId')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Stock.countDocuments(query),
    ]);

    return { stocks, total };
  }

  async create(data: Partial<IStock>): Promise<IStock> {
    return Stock.create(data);
  }

  async update(id: string, data: Partial<IStock>): Promise<IStock | null> {
    return Stock.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await Stock.findByIdAndDelete(id);
    return !!result;
  }

  async updateQuantity(
    productId: string,
    quantityChange: number,
    action: 'add' | 'deduct' | 'reserve' | 'release' | 'adjust',
    reason?: string,
    performedBy?: string
  ): Promise<IStock | null> {
    const stock = await Stock.findOne({ productId });
    if (!stock) return null;

    switch (action) {
      case 'add':
        stock.quantity += quantityChange;
        break;
      case 'deduct':
        stock.quantity = Math.max(0, stock.quantity - quantityChange);
        break;
      case 'reserve':
        if (stock.quantity < quantityChange) return null;
        stock.quantity -= quantityChange;
        break;
      case 'release':
        stock.quantity += quantityChange;
        break;
      case 'adjust':
        stock.quantity = Math.max(0, quantityChange);
        break;
    }

    if (performedBy) {
      stock.lastUpdatedBy = new mongoose.Types.ObjectId(performedBy);
    }

    return stock.save();
  }

  async getLowStockProducts(): Promise<IStock[]> {
    return Stock.find({
      $expr: { $lte: ['$quantity', '$minStock'] },
    })
      .populate('productId')
      .sort({ quantity: 1 });
  }
}

export const stockRepository = new StockRepository();
