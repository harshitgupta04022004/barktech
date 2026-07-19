import { FastifyRequest, FastifyReply } from 'fastify';
import { invoiceService } from '../services/invoice.service.js';
import { z } from 'zod';

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  hsnCode: z.string().optional().default(''),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  gstRate: z.number().min(0).max(100).default(18),
});

const createInvoiceSchema = z.object({
  leadId: z.string().optional(),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().optional(),
  customerCompany: z.string().optional(),
  customerAddress: z.string().optional(),
  customerGst: z.string().optional(),
  shipToAddress: z.string().optional(),
  modeOfDelivery: z.string().optional().default('BY TRANSPORT'),
  dispatchFrom: z.string().optional(),
  refAttendedBy: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1),
  gstRate: z.number().min(0).max(100).optional().default(18),
  currency: z.string().optional().default('INR'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  bankName: z.string().optional(),
  bankBank: z.string().optional(),
  bankAddress: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankIfscCode: z.string().optional(),
  bankSwiftCode: z.string().optional(),
  status: z.string().optional(),
});

export class InvoiceController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, status, search } = request.query as any;
    const result = await invoiceService.listInvoices({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
      search,
    });
    return reply.send({
      success: true,
      data: result.invoices,
      meta: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 20)),
      },
    });
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const invoice = await invoiceService.getInvoice(id);
    return reply.send({ success: true, data: invoice });
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createInvoiceSchema.parse(request.body);
    const user = (request as any).user;
    const invoice = await invoiceService.createInvoice({ ...body, createdBy: user?.sub });
    return reply.status(201).send({ success: true, data: invoice });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = createInvoiceSchema.partial().parse(request.body);
    const invoice = await invoiceService.updateInvoice(id, body);
    return reply.send({ success: true, data: invoice });
  }

  async stats(request: FastifyRequest, reply: FastifyReply) {
    const stats = await invoiceService.getStats();
    return reply.send({ success: true, data: stats });
  }

  async submit(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const invoice = await invoiceService.updateStatus(id, 'sent');
    return reply.send({ success: true, data: invoice });
  }

  async markPaid(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const invoice = await invoiceService.updateStatus(id, 'paid');
    return reply.send({ success: true, data: invoice });
  }

  async partialPayment(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const invoice = await invoiceService.updateStatus(id, 'partially_paid');
    return reply.send({ success: true, data: invoice });
  }

  async cancel(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const invoice = await invoiceService.updateStatus(id, 'cancelled');
    return reply.send({ success: true, data: invoice });
  }

  async generatePdf(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = await invoiceService.generatePdf(id);

    // Try to call Python agent for actual PDF generation
    try {
      const agentUrl = process.env.AGENT_URL || 'http://localhost:8000';
      const response = await fetch(`${agentUrl}/invoice/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.pdfData),
      });

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        return reply
          .header('Content-Type', 'application/pdf')
          .header('Content-Disposition', `attachment; filename="${result.filename}"`)
          .send(Buffer.from(buffer));
      }
    } catch (err) {
      console.log('Python agent PDF generation failed, returning metadata:', err);
    }

    // Fallback: return metadata for frontend to handle
    return reply.send({ success: true, data: result });
  }

  async nextNumber(request: FastifyRequest, reply: FastifyReply) {
    const nextNum = await invoiceService.getNextInvoiceNumber();
    return reply.send({ success: true, data: { nextNumber: nextNum } });
  }

  async validateNumber(request: FastifyRequest, reply: FastifyReply) {
    const { number } = request.params as { number: string };
    const exists = await invoiceService.invoiceNumberExists(number);
    return reply.send({ success: true, data: { exists, valid: !exists } });
  }
}

export const invoiceController = new InvoiceController();
