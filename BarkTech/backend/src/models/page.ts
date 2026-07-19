import mongoose, { Schema, Document } from 'mongoose';

export interface IPage extends Document {
  slug: string;
  title: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pageSchema = new Schema<IPage>(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    content: { type: String },
    metaTitle: { type: String },
    metaDescription: { type: String },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

pageSchema.index({ slug: 1 });
pageSchema.index({ published: 1 });

export const Page = mongoose.model<IPage>('Page', pageSchema);
