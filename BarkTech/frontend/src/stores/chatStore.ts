import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/constants';
import type { Thread, ChatFile } from '@/api/agentChat';

/** Get current user ID from localStorage (set by auth store) */
function getCurrentUserId(): string {
  try {
    const userStr = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (userStr) {
      const user = JSON.parse(userStr);
      return user._id || user.id || 'anonymous';
    }
  } catch { /* ignore */ }
  return 'anonymous';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
  }>;
  files?: ChatFile[];
}

interface ChatState {
  threads: Thread[];
  activeThreadId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  threadMessages: Record<string, ChatMessage[]>;

  setThreads: (threads: Thread[]) => void;
  createThread: () => string;
  setActiveThread: (threadId: string | null) => void;
  deleteThread: (threadId: string) => void;

  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
  updateLastMessage: (content: string) => void;
  addToolCall: (toolName: string, args: Record<string, unknown>) => void;
  loadThreadMessages: (threadId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      threads: [],
      activeThreadId: null,
      messages: [],
      isStreaming: false,
      threadMessages: {},

      setThreads: (threads) => {
        set({ threads });
      },

      createThread: () => {
        const userId = getCurrentUserId();
        const threadId = `admin-${userId}`;
        const newThread: Thread = {
          thread_id: threadId,
          title: 'New Conversation',
          last_message_at: new Date().toISOString(),
          message_count: 0,
        };
        set({
          threads: [newThread, ...get().threads],
          activeThreadId: threadId,
          messages: [],
        });
        return threadId;
      },

      setActiveThread: (threadId) => {
        if (threadId === null) {
          set({ activeThreadId: null, messages: [] });
          return;
        }
        const stored = get().threadMessages[threadId] || [];
        set({ activeThreadId: threadId, messages: stored });
      },

      deleteThread: (threadId) => {
        const { threads, activeThreadId, threadMessages } = get();
        const newThreads = threads.filter((t) => t.thread_id !== threadId);
        const newThreadMessages = { ...threadMessages };
        delete newThreadMessages[threadId];
        set({
          threads: newThreads,
          activeThreadId: activeThreadId === threadId ? null : activeThreadId,
          messages: activeThreadId === threadId ? [] : get().messages,
          threadMessages: newThreadMessages,
        });
      },

      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };
        const updatedMessages = [...get().messages, newMessage];
        set({ messages: updatedMessages });

        const { activeThreadId, threadMessages } = get();
        if (activeThreadId) {
          set({
            threadMessages: {
              ...threadMessages,
              [activeThreadId]: updatedMessages,
            },
          });
        }
      },

      setStreaming: (streaming) => {
        set({ isStreaming: streaming });
      },

      clearMessages: () => {
        set({ messages: [] });
        const { activeThreadId, threadMessages } = get();
        if (activeThreadId) {
          set({
            threadMessages: {
              ...threadMessages,
              [activeThreadId]: [],
            },
          });
        }
      },

      updateLastMessage: (content) => {
        const messages = [...get().messages];
        const last = messages[messages.length - 1];
        if (last) {
          messages[messages.length - 1] = { ...last, content };
          set({ messages });

          const { activeThreadId, threadMessages } = get();
          if (activeThreadId) {
            set({
              threadMessages: {
                ...threadMessages,
                [activeThreadId]: messages,
              },
            });
          }
        }
      },

      addToolCall: (toolName, args) => {
        const messages = [...get().messages];
        const last = messages[messages.length - 1];
        if (last && last.role === 'assistant') {
          const toolCalls = last.toolCalls || [];
          messages[messages.length - 1] = {
            ...last,
            toolCalls: [...toolCalls, { name: toolName, args }],
          };
          set({ messages });

          const { activeThreadId, threadMessages } = get();
          if (activeThreadId) {
            set({
              threadMessages: {
                ...threadMessages,
                [activeThreadId]: messages,
              },
            });
          }
        }
      },

      loadThreadMessages: (threadId) => {
        const stored = get().threadMessages[threadId] || [];
        set({ messages: stored });
      },
    }),
    {
      name: STORAGE_KEYS.CHAT_MESSAGES,
      partialize: (state) => ({
        threads: state.threads,
        activeThreadId: state.activeThreadId,
        threadMessages: state.threadMessages,
      }),
    }
  )
);
