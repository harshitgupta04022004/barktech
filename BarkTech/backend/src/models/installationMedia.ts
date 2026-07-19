import mongoose, { Schema, Document } from 'mongoose';

export interface IInstallationMedia extends Document {
  installationId: mongoose.Types.ObjectId;
  mediaType: 'image' | 'video';
  url: string;
  caption?: string;
  sortOrder: number;
}

const installationMediaSchema = new Schema<IInstallationMedia>(
  {
    installationId: { type: Schema.Types.ObjectId, ref: 'Installation', required: true },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    url: { type: String, required: true },
    caption: { type: String },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

installationMediaSchema.index({ installationId: 1 });

export const InstallationMedia = mongoose.model<IInstallationMedia>('InstallationMedia', installationMediaSchema);
