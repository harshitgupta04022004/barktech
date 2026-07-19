import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS, CHAT_TTL_MS } from '@/lib/constants';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
  updateLastMessage: (content: string) => void;
}

function isExpired(): boolean {
  const expiry = localStorage.getItem(STORAGE_KEYS.CHAT_EXPIRY);
  if (!expiry) return false;
  return Date.now() > parseInt(expiry, 10);
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isStreaming: false,

      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };
        set({ messages: [...get().messages, newMessage] });
        localStorage.setItem(STORAGE_KEYS.CHAT_EXPIRY, String(Date.now() + CHAT_TTL_MS));
      },

      setStreaming: (streaming) => {
        set({ isStreaming: streaming });
      },

      clearMessages: () => {
        set({ messages: [] });
        localStorage.removeItem(STORAGE_KEYS.CHAT_EXPIRY);
      },

      updateLastMessage: (content) => {
        const messages = [...get().messages];
        const last = messages[messages.length - 1];
        if (last) {
          messages[messages.length - 1] = { ...last, content };
          set({ messages });
        }
      },
    }),
    {
      name: STORAGE_KEYS.CHAT_MESSAGES,
      partialize: (state) => ({
        messages: isExpired() ? [] : state.messages,
      }),
    }
  )
);
