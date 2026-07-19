import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailSequence extends Document {
  name: string;
  triggerType: 'rfq_submit' | 'datasheet_download' | 'newsletter_signup';
  isActive: boolean;
  createdAt: Date;
}

const emailSequenceSchema = new Schema<IEmailSequence>(
  {
    name: { type: String, required: true, trim: true },
    triggerType: {
      type: String,
      enum: ['rfq_submit', 'datasheet_download', 'newsletter_signup'],
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

emailSequenceSchema.index({ triggerType: 1 });
emailSequenceSchema.index({ isActive: 1 });

export const EmailSequence = mongoose.model<IEmailSequence>('EmailSequence', emailSequenceSchema);
