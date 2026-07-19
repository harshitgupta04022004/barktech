import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  authorId?: mongoose.Types.ObjectId;
  imageUrl?: string;
  tags?: string;
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

const blogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String },
    content: { type: String },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    imageUrl: { type: String },
    tags: { type: String },
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

blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ published: 1 });
blogPostSchema.index({ reviewStatus: 1 });
blogPostSchema.index({ authorId: 1 });
blogPostSchema.index({ createdAt: -1 });

export const BlogPost = mongoose.model<IBlogPost>('BlogPost', blogPostSchema);
