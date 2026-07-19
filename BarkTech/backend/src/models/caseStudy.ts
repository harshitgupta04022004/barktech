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
  published: boolean;
  publishedAt?: Date;
  status: string;
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
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true }
);

caseStudySchema.index({ slug: 1 });
caseStudySchema.index({ status: 1 });
caseStudySchema.index({ createdAt: -1 });

export const CaseStudy = mongoose.model<ICaseStudy>('CaseStudy', caseStudySchema, 'case_studies');
