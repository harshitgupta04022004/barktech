import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  city?: string;
  productId?: mongoose.Types.ObjectId;
  message?: string;
  source: 'web_form' | 'rfq' | 'ai_chat' | 'whatsapp' | 'phone' | 'email' | 'ad_campaign';
  status: 'new' | 'contacted' | 'quoted' | 'won' | 'lost' | 'spam';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  subject?: string;
  quantity?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  assignedTo?: mongoose.Types.ObjectId;
  extraData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String },
    company: { type: String, trim: true },
    city: { type: String, trim: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    message: { type: String },
    source: {
      type: String,
      enum: ['web_form', 'rfq', 'ai_chat', 'whatsapp', 'phone', 'email', 'ad_campaign'],
      default: 'web_form',
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'quoted', 'won', 'lost', 'spam'],
      default: 'new',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    subject: { type: String },
    quantity: { type: Number },
    utmSource: { type: String },
    utmMedium: { type: String },
    utmCampaign: { type: String },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    extraData: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

leadSchema.index({ status: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ priority: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ createdAt: -1 });

export const Lead = mongoose.model<ILead>('Lead', leadSchema);
