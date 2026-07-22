import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/constants';
import type { Thread } from '@/api/agentChat';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
  }>;
}

interface ChatState {
  // Thread management
  threads: Thread[];
  activeThreadId: string | null;

  // Messages for the active thread
  messages: ChatMessage[];
  isStreaming: boolean;

  // Thread actions
  setThreads: (threads: Thread[]) => void;
  createThread: () => string;
  setActiveThread: (threadId: string | null) => void;
  deleteThread: (threadId: string) => void;

  // Message actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
  updateLastMessage: (content: string) => void;
  addToolCall: (toolName: string, args: Record<string, unknown>) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      threads: [],
      activeThreadId: null,
      messages: [],
      isStreaming: false,

      setThreads: (threads) => {
        set({ threads });
      },

      createThread: () => {
        const threadId = `admin-${crypto.randomUUID().slice(0, 8)}`;
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
        set({ activeThreadId: threadId, messages: [] });
      },

      deleteThread: (threadId) => {
        const { threads, activeThreadId } = get();
        const newThreads = threads.filter((t) => t.thread_id !== threadId);
        set({
          threads: newThreads,
          activeThreadId: activeThreadId === threadId ? null : activeThreadId,
          messages: activeThreadId === threadId ? [] : get().messages,
        });
      },

      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };
        set({ messages: [...get().messages, newMessage] });
      },

      setStreaming: (streaming) => {
        set({ isStreaming: streaming });
      },

      clearMessages: () => {
        set({ messages: [] });
      },

      updateLastMessage: (content) => {
        const messages = [...get().messages];
        const last = messages[messages.length - 1];
        if (last) {
          messages[messages.length - 1] = { ...last, content };
          set({ messages });
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
        }
      },
    }),
    {
      name: STORAGE_KEYS.CHAT_MESSAGES,
      partialize: (state) => ({
        threads: state.threads,
        activeThreadId: state.activeThreadId,
      }),
    }
  )
);
