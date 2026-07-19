import { ChatTurnLog, ToolCallLog, IChatTurnLog, IToolCallLog } from '../models/chat_observability.js';

export class ChatObservabilityRepository {
  async logTurn(data: Partial<IChatTurnLog>): Promise<IChatTurnLog> {
    return ChatTurnLog.create(data);
  }

  async logToolCall(data: Partial<IToolCallLog>): Promise<IToolCallLog> {
    return ToolCallLog.create(data);
  }

  async getTurns(threadId: string, page = 1, limit = 50): Promise<{ turns: IChatTurnLog[]; total: number }> {
    const [turns, total] = await Promise.all([
      ChatTurnLog.find({ threadId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      ChatTurnLog.countDocuments({ threadId }),
    ]);
    return { turns, total };
  }

  async getToolCalls(threadId: string, page = 1, limit = 50): Promise<{ calls: IToolCallLog[]; total: number }> {
    const [calls, total] = await Promise.all([
      ToolCallLog.find({ threadId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      ToolCallLog.countDocuments({ threadId }),
    ]);
    return { calls, total };
  }

  async getAllTurns(page = 1, limit = 50): Promise<{ turns: IChatTurnLog[]; total: number }> {
    const [turns, total] = await Promise.all([
      ChatTurnLog.find().populate('userId').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      ChatTurnLog.countDocuments(),
    ]);
    return { turns, total };
  }

  async getToolCallStats(): Promise<{ toolName: string; count: number; successCount: number }[]> {
    return ToolCallLog.aggregate([
      {
        $group: {
          _id: '$toolName',
          count: { $sum: 1 },
          successCount: { $sum: { $cond: ['$isSuccess', 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
      { $project: { _id: 0, toolName: '$_id', count: 1, successCount: 1 } },
    ]);
  }
}

export const chatObservabilityRepository = new ChatObservabilityRepository();
