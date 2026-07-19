import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  phone?: string;
  passwordHash: string;
  fullName: string;
  role: string;
  roleId: mongoose.Types.ObjectId;
  isActive: boolean;
  isVerified: boolean;
  avatarUrl?: string;
  company?: string;
  googleId?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    passwordHash: { type: String, select: false },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, enum: ['super_admin', 'admin', 'client'], default: 'client' },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', default: null },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    avatarUrl: { type: String },
    company: { type: String, trim: true },
    googleId: { type: String, unique: true, sparse: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  // Skip hashing for OAuth-only users (no real password)
  if (this.passwordHash === '__oauth_no_password__') return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ roleId: 1 });
userSchema.index({ isActive: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
