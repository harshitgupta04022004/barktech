import { chatRepository } from '../repositories/chat.repository.js';
import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';

const AGENT_BASE_URL = process.env.AGENT_URL || 'http://localhost:8000';

export class ChatService {
  async proxyToAgent(params: {
    message: string;
    sessionId?: string;
    source: 'client' | 'admin';
    userId?: string;
  }) {
    const endpoint =
      params.source === 'admin'
        ? `${AGENT_BASE_URL}/admin/chat`
        : `${AGENT_BASE_URL}/client/chat`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: params.message,
        session_id: params.sessionId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AppError(`Agent request failed: ${errorText}`, 502);
    }

    const data = (await response.json()) as {
      reply: string;
      session_id: string;
    };

    // Save user message
    if (params.sessionId) {
      await chatRepository.addMessage(params.sessionId, {
        role: 'user',
        content: params.message,
        timestamp: new Date(),
      });
    }

    // Ensure session exists and save assistant reply
    const sessionId = data.session_id || params.sessionId;
    if (sessionId) {
      let session = await chatRepository.findBySessionId(sessionId);
      if (!session) {
        session = await chatRepository.create({
          sessionId,
          source: params.source,
          userId: params.userId as any,
          messages: [],
        });
      }

      await chatRepository.addMessage(sessionId, {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      });
    }

    return { reply: data.reply, sessionId };
  }

  async getSessions(
    page = 1,
    limit = 20,
    source?: 'client' | 'admin',
    userId?: string
  ) {
    return chatRepository.findAll({ page, limit, source, userId });
  }

  async getSession(id: string) {
    const session = await chatRepository.findById(id);
    if (!session) throw new AppError('Chat session not found', 404);
    return session;
  }

  async getSessionBySessionId(sessionId: string) {
    const session = await chatRepository.findBySessionId(sessionId);
    if (!session) throw new AppError('Chat session not found', 404);
    return session;
  }

  async getMessages(sessionId: string) {
    const messages = await chatRepository.getMessages(sessionId);
    if (!messages.length) {
      const session = await chatRepository.findBySessionId(sessionId);
      if (!session) throw new AppError('Chat session not found', 404);
    }
    return messages;
  }
}

export const chatService = new ChatService();
