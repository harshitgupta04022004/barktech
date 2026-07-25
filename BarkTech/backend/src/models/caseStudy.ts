import mongoose, { Schema, Document } from 'mongoose';

export interface ICaseStudy extends Document {
  title: string;
  slug: string;
  clientName?: string;
  location?: string;
  industry?: string;
  summary?: string;
  content?: string;
  imageUrl?: string;
  pageSlug?: string;
  reviewStatus: 'draft' | 'in_review' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  published: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const caseStudySchema = new Schema<ICaseStudy>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    clientName: { type: String },
    location: { type: String },
    industry: { type: String },
    summary: { type: String, default: '' },
    content: { type: String, default: '' },
    imageUrl: { type: String },
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
  },
  { timestamps: true }
);

caseStudySchema.index({ slug: 1 });
caseStudySchema.index({ reviewStatus: 1 });
caseStudySchema.index({ createdAt: -1 });

export const CaseStudy = mongoose.model<ICaseStudy>('CaseStudy', caseStudySchema, 'case_studies');
