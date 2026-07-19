import mongoose, { Schema, Document } from 'mongoose';

export interface IFaq extends Document {
  categoryId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

const faqSchema = new Schema<IFaq>(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

faqSchema.index({ categoryId: 1 });
faqSchema.index({ productId: 1 });
faqSchema.index({ isActive: 1 });
faqSchema.index({ sortOrder: 1 });

export const Faq = mongoose.model<IFaq>('Faq', faqSchema);

// Backward-compatible aliases
export const FAQ = Faq;
export type IFAQ = IFaq;
