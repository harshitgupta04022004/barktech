import { AGENT_BASE_URL, STORAGE_KEYS } from '@/lib/constants';

export interface AgentChatRequest {
  message: string;
  sessionId?: string;
  history?: Array<{ role: string; content: string }>;
}

export interface AgentHealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  version: string;
  uptime: number;
  tools: string[];
}

export interface AgentChatCallbacks {
  onChunk: (content: string, fullContent: string) => void;
  onDone: (fullContent: string) => void;
  onError: (error: string) => void;
  onToolCall?: (toolName: string, args: Record<string, unknown>) => void;
}

export interface AgentChatHandle {
  abort: () => void;
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

export const agentApi = {
  async agentChat(
    request: AgentChatRequest,
    callbacks: AgentChatCallbacks
  ): Promise<AgentChatHandle> {
    const abortController = new AbortController();

    (async () => {
      try {
        const response = await fetch(`${AGENT_BASE_URL}/chat`, {
          method: 'POST',
          headers: buildHeaders(),
          body: JSON.stringify(request),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          callbacks.onError(
            errorBody.error || errorBody.message || `Agent request failed (${response.status})`
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

            const data = dataMatch[1];

            try {
              const parsed = JSON.parse(data);

              // Tool call event
              if (parsed.type === 'tool_call' || parsed.tool_calls) {
                const toolCalls = parsed.tool_calls || [parsed];
                for (const tc of toolCalls) {
                  callbacks.onToolCall?.(
                    tc.name || tc.function?.name || 'unknown',
                    tc.arguments || tc.function?.arguments || {}
                  );
                }
                continue;
              }

              // Content delta
              const token =
                parsed.content ??
                parsed.delta?.content ??
                parsed.delta ??
                parsed.text ??
                '';

              if (token) {
                fullContent += token;
                callbacks.onChunk(token, fullContent);
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

  async agentHealth(): Promise<AgentHealthResponse | null> {
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
