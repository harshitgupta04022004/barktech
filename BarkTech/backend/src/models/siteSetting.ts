import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSetting extends Document {
  key: string;
  value?: string;
}

const siteSettingSchema = new Schema<ISiteSetting>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String },
  },
  { timestamps: false }
);

siteSettingSchema.index({ key: 1 });

export const SiteSetting = mongoose.model<ISiteSetting>('SiteSetting', siteSettingSchema);
