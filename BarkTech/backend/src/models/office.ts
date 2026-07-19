import mongoose, { Schema, Document } from 'mongoose';

export interface IOffice extends Document {
  name: string;
  city: string;
  state?: string;
  country: string;
  address?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

const officeSchema = new Schema<IOffice>(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String },
    country: { type: String, default: 'India' },
    address: { type: String },
    phone: { type: String },
    email: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

officeSchema.index({ city: 1 });
officeSchema.index({ isActive: 1 });
officeSchema.index({ sortOrder: 1 });

export const Office = mongoose.model<IOffice>('Office', officeSchema);
