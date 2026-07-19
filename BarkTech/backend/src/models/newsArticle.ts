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
