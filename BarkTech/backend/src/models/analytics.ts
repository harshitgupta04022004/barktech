import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  eventType: string;
  eventCategory: string;
  eventAction: string;
  eventLabel?: string;
  eventValue?: number;
  pageUrl?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  userId?: mongoose.Types.ObjectId;
  extraData?: Record<string, any>;
  createdAt: Date;
}

export interface ISearchLog extends Document {
  query: string;
  resultsCount: number;
  source: 'header' | 'product_list' | 'search_page';
  ipHash?: string;
  createdAt: Date;
}

const analyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    eventType: { type: String, required: true },
    eventCategory: { type: String, required: true },
    eventAction: { type: String, required: true },
    eventLabel: { type: String },
    eventValue: { type: Number },
    pageUrl: { type: String },
    referrer: { type: String },
    userAgent: { type: String },
    ipAddress: { type: String },
    sessionId: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    extraData: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

analyticsEventSchema.index({ eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ sessionId: 1 });
analyticsEventSchema.index({ userId: 1 });

const searchLogSchema = new Schema<ISearchLog>(
  {
    query: { type: String, required: true },
    resultsCount: { type: Number, default: 0 },
    source: { type: String, enum: ['header', 'product_list', 'search_page'], default: 'search_page' },
    ipHash: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

searchLogSchema.index({ createdAt: -1 });

// TTL index: delete events after 90 days
analyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>('AnalyticsEvent', analyticsEventSchema, 'analytics_events');
export const SearchLog = mongoose.model<ISearchLog>('SearchLog', searchLogSchema, 'search_logs');
