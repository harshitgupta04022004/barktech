import type { PaginationParams } from './api';

export interface ChatSession {
  _id: string;
  sessionId: string;
  visitorName?: string;
  visitorEmail?: string;
  source: 'website' | 'whatsapp' | 'admin';
  status: 'active' | 'closed' | 'archived';
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
  tags?: string[];
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokenCount?: number;
  toolCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
    result?: string;
  }>;
  createdAt: string;
}

export interface ChatLog {
  _id: string;
  sessionId: string;
  event: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface ChatStats {
  totalSessions: number;
  activeSessions: number;
  closedSessions: number;
  totalMessages: number;
  avgMessagesPerSession: number;
  avgResponseTimeMs: number;
  topIntents: Array<{ intent: string; count: number }>;
}

export interface ChatFilters extends PaginationParams {
  status?: ChatSession['status'];
  source?: ChatSession['source'];
  startDate?: string;
  endDate?: string;
}

export interface ClientChatRequest {
  message: string;
  sessionId?: string;
  visitorName?: string;
  visitorEmail?: string;
}

export interface AdminChatRequest {
  message: string;
  sessionId: string;
}
