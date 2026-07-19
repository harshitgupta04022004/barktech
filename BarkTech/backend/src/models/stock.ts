import mongoose, { Schema, Document } from 'mongoose';

export interface IStock extends Document {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  unit: string;
  minStock: number;
  maxStock: number;
  location?: string;
  notes?: string;
  lastUpdatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
  createdAt: Date;
}

const stockSchema = new Schema<IStock>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, default: 'units' },
    minStock: { type: Number, default: 5 },
    maxStock: { type: Number, default: 1000 },
    location: { type: String },
    notes: { type: String },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

stockSchema.index({ productId: 1 });

export const Stock = mongoose.model<IStock>('Stock', stockSchema);
