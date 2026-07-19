import { invoiceRepository } from '../repositories/invoice.repository.js';
import { AppError } from '../utils/errors.js';
import { Invoice } from '../models/invoice.js';

const COMPANY_DEFAULTS = {
  bankName: 'BARK TECHNOLOGIES',
  bankBank: 'ICICI BANK LTD',
  bankAddress: 'NOIDA 132',
  bankAccountNo: '157905003103',
  bankIfscCode: 'ICIC0001579',
  bankSwiftCode: '',
};

function numberToWords(amount: number): string {
  if (amount <= 0) return 'ZERO RUPEES ONLY';

  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  function convertHundreds(n: number): string {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' HUNDRED ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result.trim();
  }

  const wholePart = Math.floor(amount);
  const decimalPart = Math.round((amount - wholePart) * 100);

  let result = '';
  if (wholePart >= 10000000) {
    result += convertHundreds(Math.floor(wholePart / 10000000)) + ' CRORE ';
  }
  if (wholePart >= 100000) {
    result += convertHundreds(Math.floor((wholePart % 10000000) / 100000)) + ' LAKH ';
  }
  if (wholePart >= 1000) {
    result += convertHundreds(Math.floor((wholePart % 100000) / 1000)) + ' THOUSAND ';
  }
  if (wholePart % 1000 > 0) {
    result += convertHundreds(wholePart % 1000) + ' ';
  }
  result = result.trim() + ' RUPEES';

  if (decimalPart > 0) {
    result += ' AND ' + convertHundreds(decimalPart) + ' PAISE';
  }

  return result + ' ONLY';
}

export class InvoiceService {
  async getInvoice(id: string) {
    const invoice = await invoiceRepository.findById(id);
    if (!invoice) throw new AppError('Invoice not found', 404);
    return invoice;
  }

  async listInvoices(filters: { page?: number; limit?: number; status?: string; search?: string }) {
    return invoiceRepository.findAll(filters);
  }

  async createInvoice(data: any) {
    const invoiceNumber = await invoiceRepository.getNextInvoiceNumber();

    // Calculate item amounts and totals
    const items = (data.items || []).map((item: any, index: number) => {
      const qty = item.quantity || 1;
      const rate = item.unitPrice || item.unit_price || 0;
      const gstRate = item.gstRate || item.gst_rate || 18;
      const amount = qty * rate;

      return {
        description: item.description,
        hsnCode: item.hsnCode || item.hsn_code || '',
        quantity: qty,
        unitPrice: rate,
        gstRate,
        amount,
        sortOrder: index,
      };
    });

    const subtotal = items.reduce((sum: number, item: any) => sum + item.amount, 0);
    const gstRate = data.gstRate || data.gst_rate || 18;
    const gstAmount = subtotal * (gstRate / 100);
    const grandTotal = subtotal + gstAmount;
    const amountInWords = numberToWords(grandTotal);

    return invoiceRepository.create({
      ...data,
      invoiceNumber,
      items,
      subtotal,
      gstRate,
      gstAmount,
      total: grandTotal,
      amountInWords,
      status: data.status || 'draft',
      currency: data.currency || 'INR',
      ...COMPANY_DEFAULTS,
    });
  }

  async updateInvoice(id: string, data: any) {
    // If items are provided, recalculate
    if (data.items) {
      const items = data.items.map((item: any, index: number) => {
        const qty = item.quantity || 1;
        const rate = item.unitPrice || item.unit_price || 0;
        const gstRate = item.gstRate || item.gst_rate || 18;
        const amount = qty * rate;
        return {
          description: item.description,
          hsnCode: item.hsnCode || item.hsn_code || '',
          quantity: qty,
          unitPrice: rate,
          gstRate,
          amount,
          sortOrder: index,
        };
      });

      const subtotal = items.reduce((sum: number, item: any) => sum + item.amount, 0);
      const gstRate = data.gstRate || data.gst_rate || 18;
      const gstAmount = subtotal * (gstRate / 100);
      const grandTotal = subtotal + gstAmount;

      data.items = items;
      data.subtotal = subtotal;
      data.gstRate = gstRate;
      data.gstAmount = gstAmount;
      data.total = grandTotal;
      data.amountInWords = numberToWords(grandTotal);
    }

    const invoice = await invoiceRepository.update(id, data);
    if (!invoice) throw new AppError('Invoice not found', 404);
    return invoice;
  }

  async updateStatus(id: string, status: string) {
    const validStatuses = ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status: ${status}. Valid: ${validStatuses.join(', ')}`, 400);
    }
    const updateData: any = { status };
    if (status === 'paid' || status === 'partially_paid') {
      updateData.paidAt = new Date();
    }
    const invoice = await invoiceRepository.update(id, updateData);
    if (!invoice) throw new AppError('Invoice not found', 404);
    return invoice;
  }

  async getStats() {
    const results = await Invoice.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$total' } } },
    ]);
    const totalRevenue = results.reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0);
    const totalCount = results.reduce((sum: number, r: any) => sum + r.count, 0);
    return { byStatus: results, totalRevenue, totalCount };
  }

  async generatePdf(invoiceId: string) {
    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) throw new AppError('Invoice not found', 404);

    // Build the data for the Python PDF service
    const pdfData = {
      invoice_number: invoice.invoiceNumber,
      customer_name: invoice.customerName,
      customer_company: invoice.customerCompany || '',
      customer_address: invoice.customerAddress || '',
      customer_gst: invoice.customerGst || '',
      customer_phone: invoice.customerPhone || '',
      ship_to_address: invoice.shipToAddress || '',
      mode_of_delivery: invoice.modeOfDelivery || 'BY TRANSPORT',
      dispatch_from: invoice.dispatchFrom || '',
      ref_attended_by: invoice.refAttendedBy || '',
      items: (invoice.items || []).map((item: any) => ({
        description: item.description,
        hsn_code: item.hsnCode || '',
        quantity: item.quantity,
        unit_price: item.unitPrice,
        gst_rate: item.gstRate,
        amount: item.amount,
      })),
      gst_rate: invoice.gstRate || 18,
      subtotal: invoice.subtotal,
      gst_amount: invoice.gstAmount,
      total: invoice.total,
      amount_in_words: invoice.amountInWords || numberToWords(invoice.total),
      invoice_date: invoice.createdAt?.toISOString() || new Date().toISOString(),
      bank_name: invoice.bankName || COMPANY_DEFAULTS.bankName,
      bank_bank: invoice.bankBank || COMPANY_DEFAULTS.bankBank,
      bank_address: invoice.bankAddress || COMPANY_DEFAULTS.bankAddress,
      bank_account_no: invoice.bankAccountNo || COMPANY_DEFAULTS.bankAccountNo,
      bank_ifsc: invoice.bankIfscCode || COMPANY_DEFAULTS.bankIfscCode,
      bank_swift: invoice.bankSwiftCode || '',
    };

    return {
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      pdfData,
      downloadUrl: `/api/invoices/${invoiceId}/pdf`,
      filename: `${invoice.invoiceNumber}.pdf`,
    };
  }

  async getNextInvoiceNumber(): Promise<string> {
    return invoiceRepository.getNextInvoiceNumber();
  }

  async invoiceNumberExists(number: string): Promise<boolean> {
    const invoice = await Invoice.findOne({ invoiceNumber: number });
    return !!invoice;
  }
}

export const invoiceService = new InvoiceService();
