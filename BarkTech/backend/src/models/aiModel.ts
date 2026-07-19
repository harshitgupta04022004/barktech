import mongoose, { Schema, Document } from 'mongoose';

export interface IAIModel extends Document {
  name: string;
  modelId: string;
  provider: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  role: 'client' | 'admin';
  maxTokens: number;
  temperature: number;
  createdAt: Date;
  updatedAt: Date;
}

const aiModelSchema = new Schema<IAIModel>(
  {
    name: { type: String, required: true },
    modelId: { type: String, required: true },
    provider: { type: String, default: 'openrouter' },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    role: { type: String, enum: ['client', 'admin'], required: true },
    maxTokens: { type: Number, default: 2048 },
    temperature: { type: Number, default: 0.2, min: 0, max: 2 },
  },
  { timestamps: true }
);

aiModelSchema.index({ role: 1, isActive: 1 });
aiModelSchema.index({ modelId: 1 }, { unique: true });

export const AIModel = mongoose.model<IAIModel>('AIModel', aiModelSchema);
