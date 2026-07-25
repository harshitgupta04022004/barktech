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
 // Use local time for date boundaries (not UTC)
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
 // Parse the timestamp — handle both ISO strings and Date objects
 const dateStr = thread.last_message_at;
 const date = new Date(dateStr);
 if (isNaN(date.getTime())) continue;

 // Convert to local midnight for comparison
 const threadDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

 if (threadDate.getTime() >= today.getTime()) {
 groups['Today'].push(thread);
 } else if (threadDate.getTime() >= yesterday.getTime()) {
 groups['Yesterday'].push(thread);
 } else if (threadDate.getTime() >= weekAgo.getTime()) {
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

 // Load sessions from backend on mount, merging with local threads
 useEffect(() => {
 const loadSessions = async () => {
 setLoading(true);
 const sessions = await agentChatApi.listSessions();
 if (sessions.length > 0) {
 // Merge: keep local threads that aren't in backend yet (e.g. newly created)
 const { threads: prevThreads } = useChatStore.getState();
 const backendIds = new Set(sessions.map((s) => s.thread_id));
 const localOnly = prevThreads.filter((t) => !backendIds.has(t.thread_id));
 setThreads([...localOnly, ...sessions]);
 }
 setLoading(false);
 };
 loadSessions();
 }, [setThreads]);

 const filteredThreads = threads.filter((t) =>
 t.title.toLowerCase().includes(search.toLowerCase())
 );

 const grouped = groupThreadsByDate(filteredThreads);

 const handleThreadClick = useCallback(async (threadId: string) => {
 setActiveThread(threadId);

 // If no persisted messages, try loading from backend
 const { threadMessages } = useChatStore.getState();
 if (!threadMessages[threadId] || threadMessages[threadId].length === 0) {
 const backendMessages = await agentChatApi.getSessionMessages(threadId);
 if (backendMessages.length > 0) {
 // Convert backend messages to ChatMessage format and persist
 const chatMessages = backendMessages.map((msg) => ({
 id: crypto.randomUUID(),
 role: msg.role as 'user' | 'assistant' | 'system',
 content: msg.content,
 timestamp: Date.now(),
 }));

 useChatStore.setState((state) => ({
 messages: chatMessages,
 threadMessages: {
 ...state.threadMessages,
 [threadId]: chatMessages,
 },
 }));
 }
 }
 }, [setActiveThread]);

 const handleDelete = useCallback(async (e: React.MouseEvent, threadId: string) => {
 e.stopPropagation();
 const success = await agentChatApi.deleteSession(threadId);
 if (success) {
 deleteThread(threadId);
 }
 }, [deleteThread]);

 return (
 <div className="flex h-full flex-col bg-background">
 {/* Header */}
 <div className="flex items-center justify-between px-4 py-3 border-b border-border">
 <span className="text-sm font-semibold text-foreground">Chats</span>
 <button
 onClick={onToggleSidebar}
 className="p-1 rounded-md hover:bg-accent transition-colors"
 >
 <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
 </button>
 </div>

 {/* New Chat Button */}
 <div className="px-3 py-3">
 <button
 onClick={onNewChat}
 className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
 >
 <Plus className="h-4 w-4" />
 New chat
 </button>
 </div>

 {/* Search */}
 <div className="px-3 pb-3">
 <div className="relative">
 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search chats..."
 className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#e65100]"
 />
 {search && (
 <button
 onClick={() => setSearch('')}
 className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent"
 >
 <X className="h-3 w-3 text-muted-foreground" />
 </button>
 )}
 </div>
 </div>

 {/* Thread List */}
 <div className="flex-1 overflow-y-auto px-3">
 {loading ? (
 <div className="flex items-center justify-center py-8">
 <div className="animate-pulse text-sm text-muted-foreground">Loading chats...</div>
 </div>
 ) : Object.entries(grouped).map(([label, groupThreads]) =>
 groupThreads.length > 0 ? (
 <div key={label} className="mb-4">
 <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{label}</div>
 {groupThreads.map((thread) => (
 <button
 key={thread.thread_id}
 onClick={() => handleThreadClick(thread.thread_id)}
 className={cn(
 'group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors',
 activeThreadId === thread.thread_id
 ? 'bg-accent text-foreground'
 : 'text-muted-foreground hover:bg-accent/50'
 )}
 >
 <MessageSquare className="h-4 w-4 flex-shrink-0 opacity-50" />
 <span className="flex-1 truncate">{thread.title}</span>
 <button
 onClick={(e) => handleDelete(e, thread.thread_id)}
 className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
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
 <MessageSquare className="h-8 w-8 text-muted-foreground mb-3" />
 <p className="text-sm text-muted-foreground">
 {search ? 'No chats found' : 'No conversations yet'}
 </p>
 <p className="text-xs text-muted-foreground mt-1">
 Start a new chat to begin
 </p>
 </div>
 )}
 </div>
 </div>
 );
}
