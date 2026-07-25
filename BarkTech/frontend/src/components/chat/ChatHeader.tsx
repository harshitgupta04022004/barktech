import { ArrowLeft, PanelLeft, Settings } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';

interface ChatHeaderProps {
 sidebarOpen: boolean;
 onToggleSidebar: () => void;
 onBack: () => void;
 onOpenSettings: () => void;
}

export function ChatHeader({ sidebarOpen, onToggleSidebar, onBack, onOpenSettings }: ChatHeaderProps) {
 const { activeThreadId, messages } = useChatStore();

 return (
 <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2.5">
 <div className="flex items-center gap-2">
 {!sidebarOpen && (
 <button
 onClick={onToggleSidebar}
 className="p-1.5 rounded-md hover:bg-muted transition-colors"
 title="Show sidebar (Ctrl+Shift+O)"
 >
 <PanelLeft className="h-4 w-4 text-muted-foreground" />
 </button>
 )}
 <button
 onClick={onBack}
 className="p-1.5 rounded-md hover:bg-muted transition-colors"
 title="Back to Admin Dashboard"
 >
 <ArrowLeft className="h-4 w-4 text-muted-foreground" />
 </button>
 <div className="flex items-center gap-2 ml-1">
 <span className="text-sm font-medium text-foreground">
 Bark Admin AI
 </span>
 {activeThreadId && (
 <span className="text-xs text-muted-foreground">
 {messages.length} messages
 </span>
 )}
 </div>
 </div>

 <div className="flex items-center gap-1">
 <button
 onClick={onOpenSettings}
 className="p-1.5 rounded-md hover:bg-muted transition-colors"
 title="Chat Settings"
 >
 <Settings className="h-4 w-4 text-muted-foreground" />
 </button>
 </div>
 </div>
 );
}
