import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailSubscriber extends Document {
  email: string;
  name?: string;
  source?: string;
  isActive: boolean;
  unsubscribedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmailSequence extends Document {
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  trigger: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmailSequenceLog extends Document {
  sequenceId: mongoose.Types.ObjectId;
  subscriberId: mongoose.Types.ObjectId;
  stepNumber: number;
  emailSubject: string;
  status: 'pending' | 'sent' | 'failed' | 'opened' | 'clicked';
  sentAt?: Date;
  openedAt?: Date;
  createdAt: Date;
}

const emailSubscriberSchema = new Schema<IEmailSubscriber>(
  {
    email: { type: String, required: true, unique: true, trim: true },
    name: { type: String },
    source: { type: String },
    isActive: { type: Boolean, default: true },
    unsubscribedAt: { type: Date },
  },
  { timestamps: true }
);
emailSubscriberSchema.index({ email: 1, isActive: 1 });

const emailSequenceSchema = new Schema<IEmailSequence>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    trigger: { type: String },
  },
  { timestamps: true }
);

const emailSequenceLogSchema = new Schema<IEmailSequenceLog>(
  {
    sequenceId: { type: Schema.Types.ObjectId, ref: 'EmailSequence', required: true },
    subscriberId: { type: Schema.Types.ObjectId, ref: 'EmailSubscriber', required: true },
    stepNumber: { type: Number, required: true },
    emailSubject: { type: String, required: true },
    status: { type: String, enum: ['pending', 'sent', 'failed', 'opened', 'clicked'], default: 'pending' },
    sentAt: { type: Date },
    openedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
emailSequenceLogSchema.index({ sequenceId: 1, subscriberId: 1 });

export const EmailSubscriber = mongoose.model<IEmailSubscriber>('EmailSubscriber', emailSubscriberSchema, 'email_subscribers');
export const EmailSequence = mongoose.model<IEmailSequence>('EmailSequence', emailSequenceSchema, 'email_sequences');
export const EmailSequenceLog = mongoose.model<IEmailSequenceLog>('EmailSequenceLog', emailSequenceLogSchema, 'email_sequence_logs');
