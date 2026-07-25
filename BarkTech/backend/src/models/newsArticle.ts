import mongoose, { Schema, Document } from 'mongoose';

export interface INewsArticle extends Document {
  title: string;
  slug: string;
  newsType: 'company' | 'press_release' | 'industry' | 'event' | 'award';
  excerpt?: string;
  content?: string;
  coverImageUrl?: string;
  sourceUrl?: string;
  authorId?: mongoose.Types.ObjectId;
  tags?: string;
  pageSlug?: string;
  reviewStatus: 'draft' | 'in_review' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  published: boolean;
  publishedAt?: Date;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const newsArticleSchema = new Schema<INewsArticle>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    newsType: {
      type: String,
      enum: ['company', 'press_release', 'industry', 'event', 'award'],
      default: 'company',
    },
    excerpt: { type: String },
    content: { type: String },
    coverImageUrl: { type: String },
    sourceUrl: { type: String },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    tags: { type: String },
    pageSlug: { type: String, default: null },
    reviewStatus: {
      type: String,
      enum: ['draft', 'in_review', 'approved', 'rejected'],
      default: 'draft',
    },
    reviewNotes: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
    metaTitle: { type: String },
    metaDescription: { type: String },
  },
  { timestamps: true }
);

newsArticleSchema.index({ slug: 1 });
newsArticleSchema.index({ newsType: 1 });
newsArticleSchema.index({ published: 1 });
newsArticleSchema.index({ createdAt: -1 });

export const NewsArticle = mongoose.model<INewsArticle>('NewsArticle', newsArticleSchema);
