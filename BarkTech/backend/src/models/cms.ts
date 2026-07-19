import mongoose, { Schema, Document } from 'mongoose';

export interface ICaseStudy extends Document {
  title: string;
  slug: string;
  clientName: string;
  location?: string;
  industry?: string;
  summary: string;
  content: string;
  imageUrl?: string;
  published: boolean;
  reviewStatus: 'draft' | 'in_review' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  authorId?: mongoose.Types.ObjectId;
  imageUrl?: string;
  tags: string[];
  published: boolean;
  reviewStatus: 'draft' | 'in_review' | 'approved' | 'rejected';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPage extends Document {
  slug: string;
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const caseStudySchema = new Schema<ICaseStudy>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    clientName: { type: String, required: true },
    location: { type: String },
    industry: { type: String },
    summary: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String },
    published: { type: Boolean, default: false },
    reviewStatus: { type: String, enum: ['draft', 'in_review', 'approved', 'rejected'], default: 'draft' },
    reviewNotes: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);
caseStudySchema.index({ slug: 1 });
caseStudySchema.index({ published: 1 });

const blogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    imageUrl: { type: String },
    tags: [{ type: String }],
    published: { type: Boolean, default: false },
    reviewStatus: { type: String, enum: ['draft', 'in_review', 'approved', 'rejected'], default: 'draft' },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);
blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ published: 1 });

const pageSchema = new Schema<IPage>(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    metaTitle: { type: String },
    metaDescription: { type: String },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);
pageSchema.index({ slug: 1 });

export const CaseStudy = mongoose.model<ICaseStudy>('CaseStudy', caseStudySchema, 'case_studies');
export const BlogPost = mongoose.model<IBlogPost>('BlogPost', blogPostSchema, 'blog_posts');
export const Page = mongoose.model<IPage>('Page', pageSchema, 'pages');
