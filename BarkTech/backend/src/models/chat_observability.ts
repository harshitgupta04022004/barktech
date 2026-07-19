import mongoose, { Schema, Document } from 'mongoose';

export interface IChatTurnLog extends Document {
  threadId: string;
  userId?: mongoose.Types.ObjectId;
  userMessage: string;
  assistantMessage: string;
  agentType: 'client' | 'admin';
  llmModel?: string;
  tokensUsed?: number;
  durationMs?: number;
  toolCallsCount: number;
  createdAt: Date;
}

export interface IToolCallLog extends Document {
  chatTurnId?: mongoose.Types.ObjectId;
  threadId: string;
  toolName: string;
  input: Record<string, any>;
  output?: string;
  durationMs?: number;
  isSuccess: boolean;
  errorMessage?: string;
  createdAt: Date;
}

const chatTurnLogSchema = new Schema<IChatTurnLog>(
  {
    threadId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userMessage: { type: String, required: true },
    assistantMessage: { type: String, required: true },
    agentType: { type: String, enum: ['client', 'admin'], default: 'client' },
    llmModel: { type: String },
    tokensUsed: { type: Number },
    durationMs: { type: Number },
    toolCallsCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

chatTurnLogSchema.index({ threadId: 1, createdAt: -1 });
chatTurnLogSchema.index({ userId: 1 });
// TTL: 30-day retention for chat logs
chatTurnLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const toolCallLogSchema = new Schema<IToolCallLog>(
  {
    chatTurnId: { type: Schema.Types.ObjectId, ref: 'ChatTurnLog' },
    threadId: { type: String, required: true },
    toolName: { type: String, required: true },
    input: { type: Schema.Types.Mixed },
    output: { type: String },
    durationMs: { type: Number },
    isSuccess: { type: Boolean, default: true },
    errorMessage: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

toolCallLogSchema.index({ threadId: 1, createdAt: -1 });
toolCallLogSchema.index({ toolName: 1 });
// TTL: 30-day retention
toolCallLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const ChatTurnLog = mongoose.model<IChatTurnLog>('ChatTurnLog', chatTurnLogSchema, 'chat_turn_logs');
export const ToolCallLog = mongoose.model<IToolCallLog>('ToolCallLog', toolCallLogSchema, 'tool_call_logs');
