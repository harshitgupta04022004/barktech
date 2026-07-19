import mongoose, { Schema, Document } from 'mongoose';

export interface IInstallationPhoto {
  url: string;
  caption?: string;
  takenAt?: Date;
}

export interface IInstallation extends Document {
  clientId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  machineModel: string;
  location: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  scheduledDate: Date;
  completedDate?: Date;
  engineer: string;
  notes?: string;
  photos: IInstallationPhoto[];
  createdAt: Date;
  updatedAt: Date;
}

const installationPhotoSchema = new Schema<IInstallationPhoto>(
  {
    url: { type: String, required: true },
    caption: { type: String },
    takenAt: { type: Date },
  },
  { _id: false }
);

const installationSchema = new Schema<IInstallation>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    machineModel: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed'],
      default: 'scheduled',
    },
    scheduledDate: { type: Date, required: true },
    completedDate: { type: Date },
    engineer: { type: String, required: true, trim: true },
    notes: { type: String },
    photos: [installationPhotoSchema],
  },
  { timestamps: true }
);

installationSchema.index({ clientId: 1 });
installationSchema.index({ productId: 1 });
installationSchema.index({ status: 1 });
installationSchema.index({ scheduledDate: 1 });
installationSchema.index({ createdAt: -1 });

export const Installation = mongoose.model<IInstallation>('Installation', installationSchema);
