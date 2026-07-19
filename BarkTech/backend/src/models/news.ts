import mongoose, { Schema, Document } from 'mongoose';

export interface INews extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  featuredImage?: string;
  gallery: string[];
  status: string;
  published: boolean;
  publishedAt?: Date;
  author?: mongoose.Types.ObjectId;
  tags?: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const newsSchema = new Schema<INews>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, default: '' },
    content: { type: String, default: '' },
    category: { type: String, default: 'company' },
    featuredImage: { type: String },
    gallery: [{ type: String }],
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    tags: { type: String },
    metaTitle: { type: String },
    metaDescription: { type: String },
  },
  { timestamps: true }
);

newsSchema.index({ slug: 1 });
newsSchema.index({ status: 1 });
newsSchema.index({ createdAt: -1 });

export const News = mongoose.model<INews>('News', newsSchema, 'news_articles');
