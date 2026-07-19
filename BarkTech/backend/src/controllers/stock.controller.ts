import { FastifyRequest, FastifyReply } from 'fastify';
import { stockService } from '../services/stock.service.js';
import { z } from 'zod';

const createStockSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(0),
  reserved: z.number().min(0).optional(),
  location: z.string().optional(),
  lowStockThreshold: z.number().min(0).optional(),
});

const stockActionSchema = z.object({
  quantity: z.number().positive(),
  reason: z.string().optional(),
});

export class StockController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, search, lowStockOnly } = request.query as any;
    const result = await stockService.listStocks({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search,
      lowStockOnly: lowStockOnly === 'true',
    });
    return reply.send({
      success: true,
      data: result.stocks,
      meta: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 20)),
      },
    });
  }

  async getByProductId(request: FastifyRequest, reply: FastifyReply) {
    const { productId } = request.params as { productId: string };
    const stock = await stockService.getStockByProduct(productId);
    return reply.send({ success: true, data: stock });
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createStockSchema.parse(request.body);
    const stock = await stockService.createStock(body);
    return reply.status(201).send({ success: true, data: stock });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { productId } = request.params as { productId: string };
    const body = createStockSchema.partial().parse(request.body);
    const stock = await stockService.getStockByProduct(productId);
    const updated = await stockService.updateStock(stock._id.toString(), body);
    return reply.send({ success: true, data: updated });
  }

  async addStock(request: FastifyRequest, reply: FastifyReply) {
    const { productId } = request.params as { productId: string };
    const body = stockActionSchema.parse(request.body);
    const user = (request as any).user;
    const stock = await stockService.addStock(productId, body.quantity, body.reason, user?.sub);
    return reply.send({ success: true, data: stock });
  }

  async deductStock(request: FastifyRequest, reply: FastifyReply) {
    const { productId } = request.params as { productId: string };
    const body = stockActionSchema.parse(request.body);
    const user = (request as any).user;
    const stock = await stockService.deductStock(productId, body.quantity, body.reason, user?.sub);
    return reply.send({ success: true, data: stock });
  }

  async getLowStock(request: FastifyRequest, reply: FastifyReply) {
    const stocks = await stockService.getLowStockAlerts();
    return reply.send({ success: true, data: stocks });
  }

  async getLogs(request: FastifyRequest, reply: FastifyReply) {
    const { productId } = request.params as { productId: string };
    const logs = await stockService.getStockLogs(productId);
    return reply.send({ success: true, data: logs });
  }
}

export const stockController = new StockController();
