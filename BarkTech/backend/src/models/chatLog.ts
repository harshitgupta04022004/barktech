import mongoose, { Schema, Document } from 'mongoose';

export interface IToolCall {
  name: string;
  input: string;
  output: string;
  latencyMs?: number;
  success: boolean;
}

export interface IChatLog {
  _id?: mongoose.Types.ObjectId;
  sessionId: string;
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  userName?: string;
  source: 'client' | 'admin';
  userMessage: string;
  assistantReply: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  speed?: number;
  finishReason?: string;
  toolCalls: IToolCall[];
  latencyMs?: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const toolCallSchema = new Schema<IToolCall>(
  {
    name: { type: String, required: true },
    input: { type: String },
    output: { type: String },
    latencyMs: { type: Number },
    success: { type: Boolean, default: true },
  },
  { _id: false }
);

const chatLogSchema = new Schema<IChatLog>(
  {
    sessionId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userEmail: { type: String },
    userName: { type: String },
    source: { type: String, enum: ['client', 'admin'], required: true },
    userMessage: { type: String, required: true },
    assistantReply: { type: String, required: true },
    model: { type: String, default: 'unknown' },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    speed: { type: Number },
    finishReason: { type: String },
    toolCalls: [toolCallSchema],
    latencyMs: { type: Number },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

chatLogSchema.index({ sessionId: 1 });
chatLogSchema.index({ userId: 1 });
chatLogSchema.index({ userEmail: 1 });
chatLogSchema.index({ source: 1 });
chatLogSchema.index({ createdAt: -1 });

export const ChatLog = mongoose.model<IChatLog>('ChatLog', chatLogSchema);
