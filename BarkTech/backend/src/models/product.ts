import mongoose, { Schema, Document } from 'mongoose';

export interface IProductMedia {
  url: string;
  alt?: string;
}

export interface IProductSpec {
  _id?: string;
  key: string;
  value: string;
  unit?: string;
}

export interface IProduct extends Document {
  categoryId?: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  models?: string;
  summary: string;
  shortDescription?: string;
  description?: string;
  media: IProductMedia[];
  specs: IProductSpec[];
  leadTimeDays?: string;
  warrantyMonths?: number;
  isFeatured: boolean;
  published: boolean;
  publishedAt?: Date;
  metaTitle?: string;
  metaDescription?: string;
  reviewStatus: 'draft' | 'in_review' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  llmExtractedData?: Record<string, unknown>;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productMediaSchema = new Schema<IProductMedia>(
  {
    url: { type: String, required: true },
    alt: { type: String },
  },
  { _id: false }
);

const productSpecSchema = new Schema<IProductSpec>(
  {
    key: { type: String, required: true },
    value: { type: String, required: true },
    unit: { type: String },
  },
  { _id: true }
);

const productSchema = new Schema<IProduct>(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    models: { type: String },
    summary: { type: String, default: '' },
    shortDescription: { type: String },
    description: { type: String },
    media: { type: [productMediaSchema], default: [] },
    specs: { type: [productSpecSchema], default: [] },
    leadTimeDays: { type: String },
    warrantyMonths: { type: Number },
    isFeatured: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
    metaTitle: { type: String },
    metaDescription: { type: String },
    reviewStatus: {
      type: String,
      enum: ['draft', 'in_review', 'approved', 'rejected'],
      default: 'draft',
    },
    reviewNotes: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date },
    llmExtractedData: { type: Schema.Types.Mixed },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

productSchema.index({ slug: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ name: 'text', summary: 'text', description: 'text' });
productSchema.index({ published: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ reviewStatus: 1 });
productSchema.index({ createdBy: 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
