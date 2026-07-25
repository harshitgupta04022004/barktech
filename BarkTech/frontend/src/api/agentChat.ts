/**
 * Agent Chat API — communicates with the Python FastAPI agent service.
 * Handles session management, streaming chat, and conversation history.
 * Supports file uploads for multimodal chat (images, PDFs, text files).
 */

import { AGENT_BASE_URL, STORAGE_KEYS } from '@/lib/constants';

export interface Thread {
  thread_id: string;
  title: string;
  last_message_at: string;
  message_count: number;
}

export interface ChatDelta {
  type: 'content_delta' | 'tool_call' | 'done';
  content?: string;
  tool_name?: string;
  tool_args?: Record<string, unknown>;
  thread_id?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cost: number;
  };
}

export interface AgentChatCallbacks {
  onChunk: (content: string, fullContent: string) => void;
  onDone: (fullContent: string, usage?: ChatDelta['usage']) => void;
  onError: (error: string) => void;
  onToolCall?: (toolName: string, args: Record<string, unknown>) => void;
}

export interface ChatSettingsPayload {
  model?: string;
  temperature?: number;
  streaming?: boolean;
}

export interface AgentChatHandle {
  abort: () => void;
}

/** Represents a file attached to a chat message */
export interface ChatFile {
  id: string;
  filename: string;
  size: number;
  type: string; // MIME type
  preview?: string; // base64 data URL for images
  status: 'uploading' | 'processing' | 'ready' | 'error';
  error?: string;
  /** Processed file data from the backend (image base64, extracted text, etc.) */
  processedData?: Record<string, unknown>;
}

function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const agentChatApi = {
  /**
   * List all conversation threads for the current admin user.
   */
  async listSessions(): Promise<Thread[]> {
    try {
      const response = await fetch(`${AGENT_BASE_URL}/admin/sessions`, {
        method: 'GET',
        headers: buildHeaders(),
      });
      if (!response.ok) throw new Error(`Failed to list sessions: ${response.status}`);
      const data = await response.json();
      return data.sessions || [];
    } catch (err) {
      console.error('Failed to list sessions:', err);
      return [];
    }
  },

  /**
   * Fetch conversation messages for a specific thread.
   */
  async getSessionMessages(sessionId: string): Promise<Array<{ role: string; content: string }>> {
    try {
      const response = await fetch(`${AGENT_BASE_URL}/admin/sessions/${encodeURIComponent(sessionId)}/messages`, {
        method: 'GET',
        headers: buildHeaders(),
      });
      if (!response.ok) throw new Error(`Failed to fetch messages: ${response.status}`);
      const data = await response.json();
      return data.messages || [];
    } catch (err) {
      console.error('Failed to fetch session messages:', err);
      return [];
    }
  },

  /**
   * Delete a conversation thread.
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${AGENT_BASE_URL}/admin/sessions/${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
        headers: buildHeaders(),
      });
      return response.ok;
    } catch (err) {
      console.error('Failed to delete session:', err);
      return false;
    }
  },

  /**
   * Clear conversation history for a thread.
   */
  async clearSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${AGENT_BASE_URL}/admin/sessions/${encodeURIComponent(sessionId)}/clear`, {
        method: 'POST',
        headers: buildHeaders(),
      });
      return response.ok;
    } catch (err) {
      console.error('Failed to clear session:', err);
      return false;
    }
  },

  /**
   * Send a chat message with SSE streaming response.
   * Returns a handle that can be used to abort the request.
   */
  streamChat(
    message: string,
    threadId: string,
    callbacks: AgentChatCallbacks,
    settings?: ChatSettingsPayload,
    files?: Array<Record<string, unknown>>
  ): AgentChatHandle {
    const abortController = new AbortController();

    (async () => {
      try {
        const response = await fetch(`${AGENT_BASE_URL}/admin/chat/stream`, {
          method: 'POST',
          headers: buildHeaders(),
          body: JSON.stringify({ message, thread_id: threadId, files, ...settings }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          callbacks.onError(
            errorBody.detail || errorBody.error || `Agent request failed (${response.status})`
          );
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          callbacks.onError('No response body');
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.trim() === '[DONE]') continue;

            const dataMatch = line.match(/^data:\s*(.+)$/s);
            if (!dataMatch) continue;

            const data = dataMatch[1].trim();
            if (!data || data === '[DONE]') continue;

            try {
              const parsed: ChatDelta = JSON.parse(data);

              if (parsed.type === 'content_delta' && parsed.content) {
                fullContent += parsed.content;
                callbacks.onChunk(parsed.content, fullContent);
              } else if (parsed.type === 'tool_call' && parsed.tool_name) {
                callbacks.onToolCall?.(parsed.tool_name, parsed.tool_args || {});
              } else if (parsed.type === 'done') {
                callbacks.onDone(fullContent, parsed.usage);
              } else {
                // Plain text fallback
                fullContent += data;
                callbacks.onChunk(data, fullContent);
              }
            } catch {
              // Plain text SSE — append raw
              fullContent += data;
              callbacks.onChunk(data, fullContent);
            }
          }
        }

        callbacks.onDone(fullContent);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        callbacks.onError(err instanceof Error ? err.message : 'Agent stream failed');
      }
    })();

    return {
      abort: () => abortController.abort(),
    };
  },

  /**
   * Upload files for chat attachment processing.
   * Sends files to the agent service for processing (text extraction, image encoding, etc.)
   */
  async uploadFiles(files: File[]): Promise<Array<Record<string, unknown>>> {
    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }

      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${AGENT_BASE_URL}/admin/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || `Upload failed (${response.status})`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (err) {
      console.error('File upload error:', err);
      throw err;
    }
  },

  /**
   * Check agent health status.
   */
  async health(): Promise<{ status: string } | null> {
    try {
      const response = await fetch(`${AGENT_BASE_URL}/health`, {
        method: 'GET',
        headers: buildHeaders(),
      });
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  },
};
