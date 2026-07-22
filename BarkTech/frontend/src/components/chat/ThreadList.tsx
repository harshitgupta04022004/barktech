import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Trash2, X, PanelLeftClose, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chatStore';
import { agentChatApi } from '@/api/agentChat';
import type { Thread } from '@/api/agentChat';

interface ThreadListProps {
  onNewChat: () => void;
  onToggleSidebar: () => void;
}

function groupThreadsByDate(threads: Thread[]): Record<string, Thread[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: Record<string, Thread[]> = {
    Today: [],
    Yesterday: [],
    'Previous 7 days': [],
    Older: [],
  };

  for (const thread of threads) {
    const date = new Date(thread.last_message_at);
    if (date >= today) {
      groups['Today'].push(thread);
    } else if (date >= yesterday) {
      groups['Yesterday'].push(thread);
    } else if (date >= weekAgo) {
      groups['Previous 7 days'].push(thread);
    } else {
      groups['Older'].push(thread);
    }
  }

  return groups;
}

export function ThreadList({ onNewChat, onToggleSidebar }: ThreadListProps) {
  const { threads, activeThreadId, setActiveThread, deleteThread, setThreads } = useChatStore();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Load sessions from backend on mount
  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      const sessions = await agentChatApi.listSessions();
      if (sessions.length > 0) {
        setThreads(sessions);
      }
      setLoading(false);
    };
    loadSessions();
  }, [setThreads]);

  const filteredThreads = threads.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = groupThreadsByDate(filteredThreads);

  const handleDelete = useCallback(async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    const success = await agentChatApi.deleteSession(threadId);
    if (success) {
      deleteThread(threadId);
    }
  }, [deleteThread]);

  return (
    <div className="flex h-full flex-col bg-[#f5f0e8] dark:bg-[#1a1a1a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e0d6] dark:border-[#3d3a35]">
        <span className="text-sm font-semibold text-[#1a1a1a] dark:text-[#f5f0e8]">Chats</span>
        <button
          onClick={onToggleSidebar}
          className="p-1 rounded-md hover:bg-[#e5e0d6] dark:hover:bg-[#3d3a35] transition-colors"
        >
          <PanelLeftClose className="h-4 w-4 text-[#666] dark:text-[#999]" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-lg border border-[#e5e0d6] dark:border-[#3d3a35] px-3 py-2.5 text-sm text-[#1a1a1a] dark:text-[#f5f0e8] hover:bg-[#e5e0d6] dark:hover:bg-[#3d3a35] transition-colors"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full rounded-lg border border-[#e5e0d6] dark:border-[#3d3a35] bg-white dark:bg-[#2a2a2a] pl-9 pr-3 py-2 text-sm text-[#1a1a1a] dark:text-[#f5f0e8] placeholder:text-[#999] focus:outline-none focus:ring-1 focus:ring-[#e65100]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[#e5e0d6] dark:hover:bg-[#3d3a35]"
            >
              <X className="h-3 w-3 text-[#999]" />
            </button>
          )}
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto px-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-sm text-[#999]">Loading chats...</div>
          </div>
        ) : Object.entries(grouped).map(([label, groupThreads]) =>
          groupThreads.length > 0 ? (
            <div key={label} className="mb-4">
              <div className="px-2 py-1.5 text-xs font-medium text-[#999]">{label}</div>
              {groupThreads.map((thread) => (
                <button
                  key={thread.thread_id}
                  onClick={() => setActiveThread(thread.thread_id)}
                  className={cn(
                    'group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors',
                    activeThreadId === thread.thread_id
                      ? 'bg-[#e5e0d6] dark:bg-[#3d3a35] text-[#1a1a1a] dark:text-[#f5f0e8]'
                      : 'text-[#666] dark:text-[#999] hover:bg-[#e5e0d6]/50 dark:hover:bg-[#3d3a35]/50'
                  )}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0 opacity-50" />
                  <span className="flex-1 truncate">{thread.title}</span>
                  <button
                    onClick={(e) => handleDelete(e, thread.thread_id)}
                    className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </button>
              ))}
            </div>
          ) : null
        )}
        {!loading && filteredThreads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-8 w-8 text-[#ccc] dark:text-[#555] mb-3" />
            <p className="text-sm text-[#999]">
              {search ? 'No chats found' : 'No conversations yet'}
            </p>
            <p className="text-xs text-[#bbb] dark:text-[#666] mt-1">
              Start a new chat to begin
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
