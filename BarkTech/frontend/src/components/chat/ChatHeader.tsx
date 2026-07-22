import { ArrowLeft, PanelLeft, Settings } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';

interface ChatHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onBack: () => void;
}

export function ChatHeader({ sidebarOpen, onToggleSidebar, onBack }: ChatHeaderProps) {
  const { activeThreadId, messages } = useChatStore();

  return (
    <div className="flex items-center justify-between border-b border-[#e5e0d6] dark:border-[#3d3a35] bg-[#f5f0e8] dark:bg-[#1a1a1a] px-4 py-2.5">
      <div className="flex items-center gap-2">
        {!sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md hover:bg-[#e5e0d6] dark:hover:bg-[#3d3a35] transition-colors"
            title="Show sidebar (Ctrl+Shift+O)"
          >
            <PanelLeft className="h-4 w-4 text-[#666] dark:text-[#999]" />
          </button>
        )}
        <button
          onClick={onBack}
          className="p-1.5 rounded-md hover:bg-[#e5e0d6] dark:hover:bg-[#3d3a35] transition-colors"
          title="Back to Admin Dashboard"
        >
          <ArrowLeft className="h-4 w-4 text-[#666] dark:text-[#999]" />
        </button>
        <div className="flex items-center gap-2 ml-1">
          <span className="text-sm font-medium text-[#1a1a1a] dark:text-[#f5f0e8]">
            Bark Admin AI
          </span>
          {activeThreadId && (
            <span className="text-xs text-[#999]">
              {messages.length} messages
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="p-1.5 rounded-md hover:bg-[#e5e0d6] dark:hover:bg-[#3d3a35] transition-colors">
          <Settings className="h-4 w-4 text-[#666] dark:text-[#999]" />
        </button>
      </div>
    </div>
  );
}
