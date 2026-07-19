import mongoose, { Schema, Document } from 'mongoose';

export interface ISearchLog extends Document {
  query: string;
  resultsCount: number;
  source: 'header' | 'product_list' | 'search_page';
  ipHash?: string;
  createdAt: Date;
}

const searchLogSchema = new Schema<ISearchLog>(
  {
    query: { type: String, required: true, trim: true },
    resultsCount: { type: Number, default: 0 },
    source: {
      type: String,
      enum: ['header', 'product_list', 'search_page'],
      default: 'header',
    },
    ipHash: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

searchLogSchema.index({ query: 'text' });
searchLogSchema.index({ source: 1 });
searchLogSchema.index({ createdAt: -1 });

export const SearchLog = mongoose.model<ISearchLog>('SearchLog', searchLogSchema);
