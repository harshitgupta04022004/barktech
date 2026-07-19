import mongoose, { Schema, Document } from 'mongoose';

export interface IStockLog extends Document {
  stockId: mongoose.Types.ObjectId;
  action: 'add' | 'remove' | 'adjust' | 'reserve' | 'release';
  quantityChange: number;
  reason?: string;
  performedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const stockLogSchema = new Schema<IStockLog>(
  {
    stockId: { type: Schema.Types.ObjectId, ref: 'Stock', required: true },
    action: {
      type: String,
      enum: ['add', 'remove', 'adjust', 'reserve', 'release'],
      required: true,
    },
    quantityChange: { type: Number, required: true },
    reason: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

stockLogSchema.index({ stockId: 1 });
stockLogSchema.index({ createdAt: -1 });

export const StockLog = mongoose.model<IStockLog>('StockLog', stockLogSchema);
