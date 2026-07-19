import mongoose, { Schema, Document } from 'mongoose';

export type SubscriberStatus = 'active' | 'unsubscribed' | 'bounced';

export interface ISubscriber extends Document {
  email: string;
  name?: string;
  source: string;
  status: SubscriberStatus;
  doubleOptIn?: Date;
  unsubscribedAt?: Date;
  createdAt: Date;
}

const subscriberSchema = new Schema<ISubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String },
    source: { type: String, default: 'newsletter' },
    status: {
      type: String,
      enum: ['active', 'unsubscribed', 'bounced'],
      default: 'active',
    },
    doubleOptIn: { type: Date },
    unsubscribedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

subscriberSchema.index({ email: 1 });
subscriberSchema.index({ status: 1 });

export const Subscriber = mongoose.model<ISubscriber>('Subscriber', subscriberSchema);
