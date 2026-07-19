import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem extends Document {
  invoiceId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  description: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  amount: number;
  sortOrder: number;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    description: { type: String, required: true },
    hsnCode: { type: String },
    quantity: { type: Number, required: true, default: 1, min: 0 },
    unitPrice: { type: Number, required: true, default: 0, min: 0 },
    gstRate: { type: Number, required: true, default: 0, min: 0, max: 100 },
    amount: { type: Number, required: true, default: 0 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

invoiceItemSchema.index({ invoiceId: 1 });
invoiceItemSchema.index({ productId: 1 });

export const InvoiceItem = mongoose.model<IInvoiceItem>('InvoiceItem', invoiceItemSchema);
