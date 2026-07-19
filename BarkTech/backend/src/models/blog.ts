import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featuredImage?: string;
  author: mongoose.Types.ObjectId;
  status: 'draft' | 'published';
  publishedAt?: Date;
  readTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    tags: [{ type: String, trim: true }],
    featuredImage: { type: String },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    publishedAt: { type: Date },
    readTime: { type: Number },
  },
  { timestamps: true }
);

blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ createdAt: -1 });

export const Blog = mongoose.model<IBlog>('Blog', blogSchema, 'blog_posts');
