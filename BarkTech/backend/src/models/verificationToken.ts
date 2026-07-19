import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  type: 'email_verify' | 'phone_verify' | 'password_reset' | 'otp';
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const verificationTokenSchema = new Schema<IVerificationToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ['email_verify', 'phone_verify', 'password_reset', 'otp'],
      required: true,
    },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

verificationTokenSchema.index({ tokenHash: 1 });
verificationTokenSchema.index({ userId: 1 });
verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const VerificationToken = mongoose.model<IVerificationToken>('VerificationToken', verificationTokenSchema);
