import mongoose, { Schema, Document } from 'mongoose';

export interface IChatTurnLog extends Document {
  sessionId: string;
  userMessage: string;
  assistantReply: string;
  language: string;
  intent?: string;
  latencyMs?: number;
  tokenCountPrompt?: number;
  tokenCountCompletion?: number;
  toolCallsSummary?: string;
  matchedProductIds?: string;
  createdAt: Date;
}

const chatTurnLogSchema = new Schema<IChatTurnLog>(
  {
    sessionId: { type: String, required: true },
    userMessage: { type: String, required: true },
    assistantReply: { type: String, required: true },
    language: { type: String, default: 'en' },
    intent: { type: String },
    latencyMs: { type: Number },
    tokenCountPrompt: { type: Number },
    tokenCountCompletion: { type: Number },
    toolCallsSummary: { type: String },
    matchedProductIds: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

chatTurnLogSchema.index({ sessionId: 1 });
chatTurnLogSchema.index({ createdAt: -1 });

export const ChatTurnLog = mongoose.model<IChatTurnLog>('ChatTurnLog', chatTurnLogSchema);
