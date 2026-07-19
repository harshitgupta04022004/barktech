import { stockRepository } from '../repositories/stock.repository.js';
import { AppError } from '../utils/errors.js';

export class StockService {
  async getStock(id: string) {
    const stock = await stockRepository.findById(id);
    if (!stock) throw new AppError('Stock record not found', 404);
    return stock;
  }

  async getStockByProduct(productId: string) {
    const stock = await stockRepository.findByProductId(productId);
    if (!stock) throw new AppError('Stock record not found for this product', 404);
    return stock;
  }

  async listStocks(filters: {
    page?: number;
    limit?: number;
    search?: string;
    lowStockOnly?: boolean;
  }) {
    return stockRepository.findAll(filters);
  }

  async createStock(data: any) {
    const existing = await stockRepository.findByProductId(data.productId);
    if (existing) throw new AppError('Stock record already exists for this product', 409);
    return stockRepository.create(data);
  }

  async updateStock(id: string, data: any) {
    const stock = await stockRepository.update(id, data);
    if (!stock) throw new AppError('Stock record not found', 404);
    return stock;
  }

  async deleteStock(id: string) {
    const deleted = await stockRepository.delete(id);
    if (!deleted) throw new AppError('Stock record not found', 404);
  }

  async addStock(productId: string, quantity: number, reason?: string, performedBy?: string) {
    const stock = await stockRepository.findByProductId(productId);
    if (!stock) throw new AppError('Stock record not found for this product', 404);
    if (quantity <= 0) throw new AppError('Quantity must be positive', 400);
    const updated = await stockRepository.updateQuantity(productId, quantity, 'add', reason, performedBy);
    if (!updated) throw new AppError('Failed to add stock', 500);
    return updated;
  }

  async deductStock(productId: string, quantity: number, reason?: string, performedBy?: string) {
    const stock = await stockRepository.findByProductId(productId);
    if (!stock) throw new AppError('Stock record not found for this product', 404);
    if (quantity <= 0) throw new AppError('Quantity must be positive', 400);
    if (stock.quantity < quantity) {
      throw new AppError('Insufficient available stock', 400);
    }
    const updated = await stockRepository.updateQuantity(productId, quantity, 'deduct', reason, performedBy);
    if (!updated) throw new AppError('Failed to deduct stock', 500);
    return updated;
  }

  async reserveStock(productId: string, quantity: number, reason?: string, performedBy?: string) {
    if (quantity <= 0) throw new AppError('Quantity must be positive', 400);
    const updated = await stockRepository.updateQuantity(productId, quantity, 'reserve', reason, performedBy);
    if (!updated) throw new AppError('Insufficient stock to reserve', 400);
    return updated;
  }

  async releaseReservation(productId: string, quantity: number, reason?: string, performedBy?: string) {
    if (quantity <= 0) throw new AppError('Quantity must be positive', 400);
    const updated = await stockRepository.updateQuantity(productId, quantity, 'release', reason, performedBy);
    if (!updated) throw new AppError('Failed to release reservation', 500);
    return updated;
  }

  async getLowStockAlerts() {
    return stockRepository.getLowStockProducts();
  }

  async getStockLogs(productId: string) {
    const { StockLog } = await import('../models/stockLog.js');
    const stock = await stockRepository.findByProductId(productId);
    if (!stock) throw new AppError('Stock record not found for this product', 404);
    return StockLog.find({ stockId: stock._id }).sort({ createdAt: -1 });
  }
}

export const stockService = new StockService();
