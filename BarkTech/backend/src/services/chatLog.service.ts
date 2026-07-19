import { ChatLog, IChatLog, IToolCall } from '../models/chatLog.js';

export class ChatLogService {
  async createLog(data: {
    sessionId: string;
    userId?: string;
    userEmail?: string;
    userName?: string;
    source: 'client' | 'admin';
    userMessage: string;
    assistantReply: string;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    cost?: number;
    speed?: number;
    finishReason?: string;
    toolCalls?: IToolCall[];
    latencyMs?: number;
    errorMessage?: string;
  }): Promise<IChatLog> {
    return ChatLog.create(data);
  }

  async getLogs(filters: {
    source?: string;
    userEmail?: string;
    sessionId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ logs: IChatLog[]; total: number }> {
    const { source, userEmail, sessionId, startDate, endDate, page = 1, limit = 50 } = filters;
    const query: Record<string, any> = {};

    if (source) query.source = source;
    if (userEmail) query.userEmail = { $regex: userEmail, $options: 'i' };
    if (sessionId) query.sessionId = sessionId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      ChatLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      ChatLog.countDocuments(query),
    ]);

    return { logs, total };
  }

  async getLogById(id: string): Promise<IChatLog | null> {
    return ChatLog.findById(id);
  }

  async getStats(): Promise<{
    totalLogs: number;
    totalTokens: number;
    totalCost: number;
    avgLatency: number;
    toolCallsCount: number;
  }> {
    const result = await ChatLog.aggregate([
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          totalTokens: { $sum: '$totalTokens' },
          totalCost: { $sum: '$cost' },
          avgLatency: { $avg: '$latencyMs' },
          toolCallsCount: { $sum: { $size: '$toolCalls' } },
        },
      },
    ]);

    return result[0] || {
      totalLogs: 0,
      totalTokens: 0,
      totalCost: 0,
      avgLatency: 0,
      toolCallsCount: 0,
    };
  }
}

export const chatLogService = new ChatLogService();
