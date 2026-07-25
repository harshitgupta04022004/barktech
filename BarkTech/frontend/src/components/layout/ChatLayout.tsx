import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ThreadList } from '@/components/chat/ThreadList';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatArea } from '@/components/chat/ChatArea';
import { ChatSettingsPanel, type ChatSettings } from '@/components/chat/ChatSettings';
import { useChatStore } from '@/stores/chatStore';

const defaultSettings: ChatSettings = {
  model: 'xiaomi/mimo-v2.5-pro',
  temperature: 0.2,
  streaming: true,
};

export function ChatLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>(() => {
    try {
      const saved = localStorage.getItem('bark_chat_settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
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

  const handleSaveSettings = useCallback((newSettings: ChatSettings) => {
    setSettings(newSettings);
    localStorage.setItem('bark_chat_settings', JSON.stringify(newSettings));
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar — Thread List */}
      <div
        className={cn(
          'flex-shrink-0 border-r border-border transition-all duration-300 ease-in-out',
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
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* Chat Content */}
        <ChatArea settings={settings} />
      </div>

      {/* Settings Panel */}
      <ChatSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
