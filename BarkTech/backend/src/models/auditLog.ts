import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: 'create' | 'update' | 'delete' | 'login' | 'export' | 'publish';
  resourceType?: 'product' | 'inquiry' | 'user' | 'invoice' | 'content_post' | 'news_article';
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'login', 'export', 'publish'],
      required: true,
    },
    resourceType: {
      type: String,
      enum: ['product', 'inquiry', 'user', 'invoice', 'content_post', 'news_article'],
    },
    resourceId: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
