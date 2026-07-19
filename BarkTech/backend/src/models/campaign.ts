import mongoose, { Schema, Document } from 'mongoose';

export type CampaignPlatform = 'linkedin' | 'instagram' | 'facebook' | 'twitter' | 'reddit';
export type CampaignStatus = 'draft' | 'scheduled' | 'published';

export interface ICampaign extends Document {
  title: string;
  slug: string;
  content: string;
  platforms: CampaignPlatform[];
  status: CampaignStatus;
  scheduledAt?: Date;
  publishedAt?: Date;
  media: string[];
  tags: string[];
  author: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    platforms: {
      type: [String],
      enum: ['linkedin', 'instagram', 'facebook', 'twitter', 'reddit'],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published'],
      default: 'draft',
    },
    scheduledAt: { type: Date },
    publishedAt: { type: Date },
    media: [{ type: String }],
    tags: [{ type: String }],
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

campaignSchema.index({ slug: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ platforms: 1 });
campaignSchema.index({ author: 1 });
campaignSchema.index({ createdAt: -1 });

export const Campaign = mongoose.model<ICampaign>('Campaign', campaignSchema);
