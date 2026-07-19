import { useCallback, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { AGENT_BASE_URL } from '@/lib/constants';

interface UseChatOptions {
  onChunk?: (content: string) => void;
  onError?: (error: string) => void;
  retries?: number;
}

export function useChat(options: UseChatOptions = {}) {
  const { messages, isStreaming, addMessage, setStreaming, clearMessages, updateLastMessage } =
    useChatStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, opts?: UseChatOptions) => {
      const mergedOptions = { ...options, ...opts };

      addMessage({ role: 'user', content });
      addMessage({ role: 'assistant', content: '' });
      setStreaming(true);

      const maxRetries = mergedOptions.retries ?? 2;
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          abortControllerRef.current = new AbortController();

          const chatMessages = useChatStore
            .getState()
            .messages.filter((m) => m.role !== 'system')
            .map(({ role, content: c }) => ({ role, content: c }));

          const response = await fetch(`${AGENT_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: chatMessages }),
            signal: abortControllerRef.current.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response body');

          const decoder = new TextDecoder();
          let buffer = '';

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
                const token = parsed.content ?? parsed.delta ?? parsed.text ?? '';
                if (token) {
                  const currentMessages = useChatStore.getState().messages;
                  const lastMsg = currentMessages[currentMessages.length - 1];
                  if (lastMsg && lastMsg.role === 'assistant') {
                    updateLastMessage(lastMsg.content + token);
                    mergedOptions.onChunk?.(lastMsg.content + token);
                  }
                }
              } catch {
                // Plain text SSE — append raw
                const currentMessages = useChatStore.getState().messages;
                const lastMsg = currentMessages[currentMessages.length - 1];
                if (lastMsg && lastMsg.role === 'assistant') {
                  updateLastMessage(lastMsg.content + data);
                  mergedOptions.onChunk?.(lastMsg.content + data);
                }
              }
            }
          }

          // Success — break retry loop
          break;
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') break;

          attempt++;
          if (attempt > maxRetries) {
            mergedOptions.onError?.(err instanceof Error ? err.message : 'Stream failed');
            break;
          }
          // Brief delay before retry
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        } finally {
          setStreaming(false);
          abortControllerRef.current = null;
        }
      }
    },
    [addMessage, setStreaming, updateLastMessage, options]
  );

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setStreaming(false);
  }, [setStreaming]);

  return {
    messages,
    isStreaming,
    sendMessage,
    cancelStream,
    clearMessages,
  };
}
