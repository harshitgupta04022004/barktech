import mongoose, { Schema, Document } from 'mongoose';

export interface ISocialPublishLog extends Document {
  content_id: string;
  platform: string;
  status: 'pending' | 'published' | 'failed' | 'scheduled';
  post_id?: string;
  published_at?: Date;
  scheduled_at?: Date;
  error?: string;
  created_at: Date;
  updated_at: Date;
}

const socialPublishLogSchema = new Schema<ISocialPublishLog>(
  {
    content_id: { type: String, required: true, index: true },
    platform: { type: String, required: true },
    status: { type: String, enum: ['pending', 'published', 'failed', 'scheduled'], default: 'pending' },
    post_id: { type: String },
    published_at: { type: Date },
    scheduled_at: { type: Date },
    error: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export const SocialPublishLog = mongoose.model<ISocialPublishLog>('SocialPublishLog', socialPublishLogSchema);
