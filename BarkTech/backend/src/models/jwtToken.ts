import mongoose, { Schema, Document } from 'mongoose';

export interface IJwtToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  tokenType: 'access' | 'refresh';
  tokenVersion: number;
  tokenFamily: string;
  ipAddress?: string;
  userAgent?: string;
  scopes?: string[];
  expiresAt: Date;
  revokedAt?: Date;
  replacedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const jwtTokenSchema = new Schema<IJwtToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true },
    tokenType: {
      type: String,
      enum: ['access', 'refresh'],
      required: true,
    },
    tokenVersion: { type: Number, default: 1 },
    tokenFamily: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    scopes: [{ type: String }],
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    replacedBy: { type: Schema.Types.ObjectId, ref: 'JwtToken', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

jwtTokenSchema.index({ tokenHash: 1 });
jwtTokenSchema.index({ userId: 1 });
jwtTokenSchema.index({ tokenType: 1 });
jwtTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
jwtTokenSchema.index({ revokedAt: 1 });

export const JwtToken = mongoose.model<IJwtToken>('JwtToken', jwtTokenSchema);
