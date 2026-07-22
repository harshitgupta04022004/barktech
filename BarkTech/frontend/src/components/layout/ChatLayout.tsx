import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ThreadList } from '@/components/chat/ThreadList';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatArea } from '@/components/chat/ChatArea';
import { useChatStore } from '@/stores/chatStore';

export function ChatLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { createThread } = useChatStore();

  // Keyboard shortcut: Cmd/Ctrl+Shift+O to toggle sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleNewChat = useCallback(() => {
    createThread();
  }, [createThread]);

  return (
    <div className="flex h-screen bg-[#f5f0e8] dark:bg-[#1a1a1a]">
      {/* Sidebar — Thread List */}
      <div
        className={cn(
          'flex-shrink-0 border-r border-[#e5e0d6] dark:border-[#3d3a35] transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-[280px]' : 'w-0'
        )}
      >
        {sidebarOpen && (
          <ThreadList
            onNewChat={handleNewChat}
            onToggleSidebar={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <ChatHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onBack={() => navigate('/admin')}
        />

        {/* Chat Content */}
        <ChatArea />
      </div>
    </div>
  );
}
