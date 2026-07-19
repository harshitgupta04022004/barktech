import { Invoice, IInvoice } from '../models/invoice.js';

export class InvoiceRepository {
  async findById(id: string): Promise<IInvoice | null> {
    return Invoice.findById(id);
  }

  async findByNumber(invoiceNumber: string): Promise<IInvoice | null> {
    return Invoice.findOne({ invoiceNumber });
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ invoices: IInvoice[]; total: number }> {
    const { page = 1, limit = 20, status, search } = filters;
    const query: Record<string, any> = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerCompany: { $regex: search, $options: 'i' } },
      ];
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Invoice.countDocuments(query),
    ]);

    return { invoices, total };
  }

  async create(data: Partial<IInvoice>): Promise<IInvoice> {
    return Invoice.create(data);
  }

  async update(id: string, data: Partial<IInvoice>): Promise<IInvoice | null> {
    return Invoice.findByIdAndUpdate(id, data, { new: true });
  }

  async getNextInvoiceNumber(): Promise<string> {
    const now = new Date();
    const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const fyEnd = fyStart + 1;
    const shortStart = String(fyStart).slice(-2);
    const shortEnd = String(fyEnd).slice(-2);
    const prefix = `BARK${shortStart}-${shortEnd}S`;

    const lastInvoice = await Invoice.findOne({ invoiceNumber: { $regex: `^${prefix}` } })
      .sort({ invoiceNumber: -1 })
      .limit(1);

    if (!lastInvoice) return `${prefix}001`;

    const lastNum = parseInt(lastInvoice.invoiceNumber.slice(-3), 10);
    const nextNum = String(lastNum + 1).padStart(3, '0');
    return `${prefix}${nextNum}`;
  }
}

export const invoiceRepository = new InvoiceRepository();
