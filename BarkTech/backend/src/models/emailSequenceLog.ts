import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailSequenceLog extends Document {
  subscriberId: mongoose.Types.ObjectId;
  subscriberEmail: string;
  sequenceId?: mongoose.Types.ObjectId;
  templateName: string;
  status: 'pending' | 'sent' | 'failed';
  errorMessage?: string;
  scheduledAt: Date;
  sentAt?: Date;
  createdAt: Date;
}

const emailSequenceLogSchema = new Schema<IEmailSequenceLog>(
  {
    subscriberId: { type: Schema.Types.ObjectId, ref: 'Subscriber', required: true },
    subscriberEmail: { type: String, required: true, lowercase: true, trim: true },
    sequenceId: { type: Schema.Types.ObjectId, ref: 'EmailSequence', default: null },
    templateName: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
    errorMessage: { type: String },
    scheduledAt: { type: Date, required: true },
    sentAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

emailSequenceLogSchema.index({ subscriberId: 1 });
emailSequenceLogSchema.index({ sequenceId: 1 });
emailSequenceLogSchema.index({ status: 1 });
emailSequenceLogSchema.index({ scheduledAt: 1 });
emailSequenceLogSchema.index({ createdAt: -1 });

export const EmailSequenceLog = mongoose.model<IEmailSequenceLog>('EmailSequenceLog', emailSequenceLogSchema);
