import {
  ChatSession,
  IChatSession,
  IChatMessage,
  ChatSource,
} from '../models/chatSession.js';

export class ChatRepository {
  async findBySessionId(sessionId: string): Promise<IChatSession | null> {
    return ChatSession.findOne({ sessionId });
  }

  async findById(id: string): Promise<IChatSession | null> {
    return ChatSession.findById(id);
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    source?: ChatSource;
    userId?: string;
  }): Promise<{ sessions: IChatSession[]; total: number }> {
    const { page = 1, limit = 20, source, userId } = filters;
    const query: Record<string, any> = {};

    if (source) query.source = source;
    if (userId) query.userId = userId;

    const [sessions, total] = await Promise.all([
      ChatSession.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ updatedAt: -1 }),
      ChatSession.countDocuments(query),
    ]);

    return { sessions, total };
  }

  async create(data: Partial<IChatSession>): Promise<IChatSession> {
    return ChatSession.create(data);
  }

  async addMessage(
    sessionId: string,
    message: IChatMessage
  ): Promise<IChatSession | null> {
    return ChatSession.findOneAndUpdate(
      { sessionId },
      { $push: { messages: message } },
      { new: true }
    );
  }

  async getMessages(sessionId: string): Promise<IChatMessage[]> {
    const session = await ChatSession.findOne({ sessionId });
    return session?.messages || [];
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const result = await ChatSession.findOneAndDelete({ sessionId });
    return !!result;
  }
}

export const chatRepository = new ChatRepository();
