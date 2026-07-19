import mongoose, { Schema, Document } from 'mongoose';

export type AnalyticsEventType = string;

export interface IAnalyticsEvent extends Document {
  eventType: string;
  eventCategory?: string;
  eventAction?: string;
  eventLabel?: string;
  eventValue?: number;
  pageUrl?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  userId?: string;
  extraData?: Record<string, unknown>;
  createdAt: Date;
}

const analyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    eventType: { type: String, required: true },
    eventCategory: { type: String },
    eventAction: { type: String },
    eventLabel: { type: String },
    eventValue: { type: Number },
    pageUrl: { type: String },
    referrer: { type: String },
    userAgent: { type: String },
    ipAddress: { type: String },
    sessionId: { type: String },
    userId: { type: String },
    extraData: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

analyticsEventSchema.index({ eventType: 1 });
analyticsEventSchema.index({ sessionId: 1 });
analyticsEventSchema.index({ createdAt: -1 });
analyticsEventSchema.index({ eventCategory: 1, eventAction: 1 });

export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>('AnalyticsEvent', analyticsEventSchema);
