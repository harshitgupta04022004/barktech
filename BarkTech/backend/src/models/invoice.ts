import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
  description: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  amount: number;
  sortOrder?: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  inquiryId?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  customerAddress?: string;
  customerGst?: string;
  shipToAddress?: string;
  modeOfDelivery?: string;
  dispatchFrom?: string;
  transportDetails?: string;
  deliveryBasis?: string;
  refAttendedBy?: string;
  currency: string;
  items: IInvoiceItem[];
  subtotal: number;
  gstAmount: number;
  gstRate: number;
  total: number;
  amountInWords?: string;
  bankName?: string;
  bankBank?: string;
  bankAddress?: string;
  bankAccountNo?: string;
  bankIfscCode?: string;
  bankSwiftCode?: string;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  notes?: string;
  terms?: string;
  dueDate?: Date;
  paidAt?: Date;
  pdfUrl?: string;
  pdfGeneratedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    description: { type: String, required: true },
    hsnCode: { type: String, default: '' },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true, default: 0 },
    gstRate: { type: Number, required: true, default: 18 },
    amount: { type: Number, required: true, default: 0 },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    inquiryId: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, lowercase: true, trim: true },
    customerPhone: { type: String },
    customerCompany: { type: String, trim: true },
    customerAddress: { type: String },
    customerGst: { type: String },
    shipToAddress: { type: String },
    modeOfDelivery: { type: String, default: 'BY TRANSPORT' },
    dispatchFrom: { type: String },
    transportDetails: { type: String },
    deliveryBasis: { type: String },
    refAttendedBy: { type: String },
    currency: { type: String, default: 'INR' },
    items: { type: [invoiceItemSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0 },
    gstAmount: { type: Number, required: true, default: 0 },
    gstRate: { type: Number, default: 18 },
    total: { type: Number, required: true, default: 0 },
    amountInWords: { type: String },
    bankName: { type: String, default: 'BARK TECHNOLOGIES' },
    bankBank: { type: String, default: 'ICICI BANK LTD' },
    bankAddress: { type: String, default: 'NOIDA 132' },
    bankAccountNo: { type: String, default: '157905003103' },
    bankIfscCode: { type: String, default: 'ICIC0001579' },
    bankSwiftCode: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'],
      default: 'draft',
    },
    notes: { type: String },
    terms: { type: String },
    dueDate: { type: Date },
    paidAt: { type: Date },
    pdfUrl: { type: String },
    pdfGeneratedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ inquiryId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ createdBy: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
