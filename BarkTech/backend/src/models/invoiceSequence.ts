import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceSequence extends Document {
  year: number;
  lastNumber: number;
}

const invoiceSequenceSchema = new Schema<IInvoiceSequence>(
  {
    year: { type: Number, required: true, unique: true },
    lastNumber: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export const InvoiceSequence = mongoose.model<IInvoiceSequence>('InvoiceSequence', invoiceSequenceSchema);
