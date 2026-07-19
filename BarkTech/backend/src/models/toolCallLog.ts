import mongoose, { Schema, Document } from 'mongoose';

export interface IToolCallLog extends Document {
  sessionId: string;
  turnId?: mongoose.Types.ObjectId;
  toolName: string;
  toolInput?: string;
  toolOutput?: string;
  latencyMs?: number;
  success: boolean;
  createdAt: Date;
}

const toolCallLogSchema = new Schema<IToolCallLog>(
  {
    sessionId: { type: String, required: true },
    turnId: { type: Schema.Types.ObjectId, ref: 'ChatTurnLog', default: null },
    toolName: { type: String, required: true },
    toolInput: { type: String },
    toolOutput: { type: String },
    latencyMs: { type: Number },
    success: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

toolCallLogSchema.index({ sessionId: 1 });
toolCallLogSchema.index({ turnId: 1 });
toolCallLogSchema.index({ toolName: 1 });
toolCallLogSchema.index({ createdAt: -1 });

export const ToolCallLog = mongoose.model<IToolCallLog>('ToolCallLog', toolCallLogSchema);
