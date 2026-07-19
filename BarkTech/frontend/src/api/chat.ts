import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  ChatSession,
  ChatMessage,
  ChatStats,
  ChatFilters,
  ClientChatRequest,
  AdminChatRequest,
} from '@/types/chat';

function toQueryParams(filters?: ChatFilters): Record<string, string | number | boolean | undefined> | undefined {
  if (!filters) return undefined;
  return {
    page: filters.page,
    limit: filters.limit,
    sort: filters.sort,
    order: filters.order,
    search: filters.search,
    status: filters.status,
    source: filters.source,
    startDate: filters.startDate,
    endDate: filters.endDate,
  };
}

export interface ClientChatResponse {
  sessionId: string;
  message: ChatMessage;
}

export interface AdminChatResponse {
  message: ChatMessage;
}

export const chatApi = {
  clientChat(data: ClientChatRequest): Promise<ApiResponse<ClientChatResponse>> {
    return apiClient.post<ClientChatResponse>('/chat/client', data);
  },

  adminChat(data: AdminChatRequest): Promise<ApiResponse<AdminChatResponse>> {
    return apiClient.post<AdminChatResponse>('/chat/admin', data);
  },

  getChatSessions(filters?: ChatFilters): Promise<PaginatedResponse<ChatSession>> {
    return apiClient.get<ChatSession[]>('/chat/sessions', toQueryParams(filters)) as Promise<PaginatedResponse<ChatSession>>;
  },

  getChatSession(sessionId: string): Promise<ApiResponse<ChatSession>> {
    return apiClient.get<ChatSession>(`/chat/sessions/${sessionId}`);
  },

  getChatMessages(sessionId: string): Promise<ApiResponse<ChatMessage[]>> {
    return apiClient.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`);
  },

  getChatStats(): Promise<ApiResponse<ChatStats>> {
    return apiClient.get<ChatStats>('/chat/stats');
  },

  closeSession(sessionId: string): Promise<ApiResponse<ChatSession>> {
    return apiClient.put<ChatSession>(`/chat/sessions/${sessionId}/close`);
  },

  addSessionTag(sessionId: string, tag: string): Promise<ApiResponse<ChatSession>> {
    return apiClient.post<ChatSession>(`/chat/sessions/${sessionId}/tags`, { tag });
  },

  removeSessionTag(sessionId: string, tag: string): Promise<ApiResponse<ChatSession>> {
    return apiClient.delete<ChatSession>(`/chat/sessions/${sessionId}/tags/${tag}`);
  },
};
