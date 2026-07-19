import mongoose, { Schema, Document } from 'mongoose';

export interface IRfqItem extends Document {
  inquiryId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  productName?: string;
  quantity: number;
  notes?: string;
  createdAt: Date;
}

const rfqItemSchema = new Schema<IRfqItem>(
  {
    inquiryId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    productName: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    notes: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

rfqItemSchema.index({ inquiryId: 1 });
rfqItemSchema.index({ productId: 1 });

export const RfqItem = mongoose.model<IRfqItem>('RfqItem', rfqItemSchema);
