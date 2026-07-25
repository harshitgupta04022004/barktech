import mongoose, { Schema, Document } from 'mongoose';

export interface IContentPost extends Document {
  postType: 'new_product' | 'new_machine' | 'installation_complete' | 'news' | 'case_study' | 'blog' | 'general';
  title?: string;
  contentText: string;
  linkUrl?: string;
  hashtags?: string;
  productId?: mongoose.Types.ObjectId;
  installationId?: mongoose.Types.ObjectId;
  newsArticleId?: mongoose.Types.ObjectId;
  caseStudyId?: mongoose.Types.ObjectId;
  blogPostId?: mongoose.Types.ObjectId;
  pageSlug?: string;
  contentHash?: string;
  scheduledAt?: Date;
  createdVia: 'agent_chat' | 'admin_form' | 'import';
  reviewStatus: 'draft' | 'in_review' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const contentPostSchema = new Schema<IContentPost>(
  {
    postType: {
      type: String,
      enum: ['new_product', 'new_machine', 'installation_complete', 'news', 'case_study', 'blog', 'general'],
      default: 'general',
    },
    title: { type: String },
    contentText: { type: String, required: true },
    linkUrl: { type: String },
    hashtags: { type: String },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    installationId: { type: Schema.Types.ObjectId, ref: 'Installation', default: null },
    newsArticleId: { type: Schema.Types.ObjectId, ref: 'NewsArticle', default: null },
    caseStudyId: { type: Schema.Types.ObjectId, ref: 'CaseStudy', default: null },
    blogPostId: { type: Schema.Types.ObjectId, ref: 'BlogPost', default: null },
    pageSlug: { type: String, default: null },
    contentHash: { type: String, default: null },
    scheduledAt: { type: Date, default: null },
    createdVia: {
      type: String,
      enum: ['agent_chat', 'admin_form', 'import'],
      default: 'admin_form',
    },
    reviewStatus: {
      type: String,
      enum: ['draft', 'in_review', 'approved', 'rejected'],
      default: 'draft',
    },
    reviewNotes: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

contentPostSchema.index({ postType: 1 });
contentPostSchema.index({ reviewStatus: 1 });
contentPostSchema.index({ createdBy: 1 });
contentPostSchema.index({ productId: 1 });
contentPostSchema.index({ createdAt: -1 });
contentPostSchema.index({ contentHash: 1, postType: 1, createdAt: -1 });
contentPostSchema.index({ scheduledAt: 1, reviewStatus: 1 });

export const ContentPost = mongoose.model<IContentPost>('ContentPost', contentPostSchema);
