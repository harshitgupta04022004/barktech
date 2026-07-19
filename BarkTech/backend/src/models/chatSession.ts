import mongoose, { Schema, Document } from 'mongoose';

export type ChatSource = 'client' | 'admin';

export interface IChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface IChatSession extends Document {
  userId?: mongoose.Types.ObjectId;
  sessionId: string;
  messages: IChatMessage[];
  source: ChatSource;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatSessionSchema = new Schema<IChatSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    sessionId: { type: String, required: true, unique: true },
    messages: [chatMessageSchema],
    source: {
      type: String,
      enum: ['client', 'admin'],
      required: true,
    },
  },
  { timestamps: true }
);

chatSessionSchema.index({ sessionId: 1 });
chatSessionSchema.index({ userId: 1 });
chatSessionSchema.index({ source: 1 });
chatSessionSchema.index({ createdAt: -1 });

export const ChatSession = mongoose.model<IChatSession>(
  'ChatSession',
  chatSessionSchema
);
