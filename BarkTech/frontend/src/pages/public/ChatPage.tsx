import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Send, Plus, Trash2, MessageSquare, LogIn, Bot, User,
  PanelLeftClose, PanelLeft, Sparkles, Clock, Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { STORAGE_KEYS, AGENT_BASE_URL } from '@/lib/constants';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Thread {
  thread_id: string;
  title: string;
  last_message_at: string;
  message_count: number;
}

const SUGGESTIONS = [
  { icon: Zap, text: 'What products do you offer?', color: 'text-amber-500' },
  { icon: Sparkles, text: 'Tell me about die cutting machines', color: 'text-blue-500' },
  { icon: MessageSquare, text: 'How can I get a quote?', color: 'text-emerald-500' },
  { icon: Clock, text: 'What are your delivery timelines?', color: 'text-violet-500' },
];

const WELCOME_MESSAGE = `Hello! Welcome to **Bark Technologies**. I'm your AI assistant — built to help you with everything related to our packaging machinery and solutions.

I can help with:
- **Product information** and specifications
- **Pricing quotes** and purchase inquiries
- **Installation services** and support
- **Technical questions** about our machinery

How can I assist you today?`;

const NEW_CHAT_MESSAGE = 'Hello! Welcome to **Bark Technologies**. How can I assist you today?';

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      setIsLoggedIn(true);
      loadSessions();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const loadSessions = async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) return;
      const res = await fetch(`${AGENT_BASE_URL}/admin/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setThreads(data.sessions || []);
      }
    } catch { /* silent */ }
  };

  const loadSessionMessages = async (threadId: string) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) return;
      const res = await fetch(`${AGENT_BASE_URL}/admin/sessions/${encodeURIComponent(threadId)}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const loaded: Message[] = (data.messages || []).map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
        if (loaded.length > 0) {
          setMessages(loaded);
          setActiveThreadId(threadId);
          if (isMobile) setSidebarOpen(false);
        }
      }
    } catch { /* silent */ }
  };

  const deleteSession = async (threadId: string) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) return;
      await fetch(`${AGENT_BASE_URL}/admin/sessions/${encodeURIComponent(threadId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setThreads((prev) => prev.filter((t) => t.thread_id !== threadId));
      if (activeThreadId === threadId) {
        setMessages([{ role: 'assistant', content: NEW_CHAT_MESSAGE }]);
        setActiveThreadId(null);
      }
    } catch { /* silent */ }
  };

  const startNewChat = () => {
    setMessages([{ role: 'assistant', content: NEW_CHAT_MESSAGE }]);
    setActiveThreadId(null);
    setInput('');
    inputRef.current?.focus();
    if (isMobile) setSidebarOpen(false);
  };

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setIsLoading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const threadId = activeThreadId || `chat-${crypto.randomUUID().slice(0, 8)}`;
      if (!activeThreadId) setActiveThreadId(threadId);
      const res = await fetch('/agent/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: msg, thread_id: threadId }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || `Chat failed (${res.status})`);
      }
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      if (isLoggedIn) loadSessions();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Sorry, something went wrong.';
      setMessages((prev) => [...prev, { role: 'assistant', content: errMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [input, isLoading]
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background overflow-hidden">
      {/* ═══════════ SIDEBAR ═══════════ */}
      {isLoggedIn && (
        <>
          {isMobile && sidebarOpen && (
            <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          )}

          <aside
            className={`fixed md:relative z-50 md:z-auto h-full flex-shrink-0 border-r border-border bg-card backdrop-blur-xl transition-all duration-300 ${
              sidebarOpen ? 'w-[280px] translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden'
            }`}
          >
            <div className="flex h-full flex-col w-[280px]">
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="text-[13px] font-semibold text-foreground">History</span>
                  {threads.length > 0 && (
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{threads.length}</span>
                  )}
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3">
                <button
                  onClick={startNewChat}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 hover:border-primary/30 transition-all duration-200 text-[13px] font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  New Conversation
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin scrollbar-thumb-white/10">
                {threads.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted border border-border">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-[13px] font-medium text-muted-foreground">No conversations yet</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/60">Start a new chat to begin</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {threads.map((thread) => (
                      <div
                        key={thread.thread_id}
                        className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-200 ${
                          activeThreadId === thread.thread_id
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-muted border border-transparent'
                        }`}
                        onClick={() => loadSessionMessages(thread.thread_id)}
                      >
                        <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
                          activeThreadId === thread.thread_id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          <MessageSquare className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-[13px] font-medium truncate ${
                            activeThreadId === thread.thread_id ? 'text-foreground' : 'text-foreground'
                          }`}>
                            {thread.title || 'New Conversation'}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {thread.message_count} messages
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteSession(thread.thread_id); }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all duration-200"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ═══════════ MAIN CHAT ═══════════ */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Chat header */}
        <header className="flex items-center gap-3 border-b border-border bg-card/60 backdrop-blur-sm px-4 py-3">
          {isLoggedIn && !sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <PanelLeft className="h-4.5 w-4.5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-600 shadow-lg shadow-primary/20">
                <Bot className="h-4.5 w-4.5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
            </div>
            <div>
              <h1 className="text-[14px] font-semibold text-foreground leading-tight">Bark AI Assistant</h1>
              <p className="text-[11px] text-muted-foreground font-medium">Always online · Enterprise AI</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {isLoggedIn && (
              <button
                onClick={startNewChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New Chat</span>
              </button>
            )}
            {!isLoggedIn && (
              <Link to="/admin/login">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <LogIn className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Login for History</span>
                </button>
              </Link>
            )}
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div className={`max-w-[85%] ${msg.role === 'user' ? '' : ''}`}>
                  {msg.role === 'user' ? (
                    <div className="rounded-2xl rounded-br-md px-4 py-3 bg-gradient-to-br from-primary to-primary/90 text-white shadow-lg shadow-primary/10">
                      <p className="text-[13.5px] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-muted border border-border backdrop-blur-sm">
                      <div className="prose prose-sm max-w-none
                        prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:text-foreground
                        prose-p:my-1.5 prose-p:text-foreground prose-p:leading-relaxed
                        prose-ul:my-1.5 prose-ol:my-1.5
                        prose-li:my-0.5 prose-li:text-foreground
                        prose-strong:text-foreground prose-strong:font-semibold
                        prose-code:text-xs prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-medium
                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                        prose-hr:border-border
                        prose-pre:bg-muted prose-pre:border prose-pre:border-border">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary mt-1">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-muted border border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[12px] text-muted-foreground font-medium">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggestion chips */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3">
            <div className="mx-auto max-w-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => sendMessage(s.text)}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 text-left hover:bg-muted hover:border-border transition-all duration-200"
                  >
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted ${s.color} group-hover:scale-110 transition-transform`}>
                      <s.icon className="h-4 w-4" />
                    </div>
                    <span className="text-[13px] text-muted-foreground group-hover:text-foreground transition-colors font-medium">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Composer */}
        <div className="border-t border-border bg-card/40 backdrop-blur-sm px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-3 rounded-2xl border border-border bg-muted p-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-300">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about our products..."
                rows={1}
                className="flex-1 resize-none bg-transparent border-0 px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 leading-relaxed"
                style={{ minHeight: '40px', maxHeight: '120px' }}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = 'auto';
                  t.style.height = Math.min(t.scrollHeight, 120) + 'px';
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/30 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground font-medium">
              Bark Technologies AI Assistant · Powered by advanced AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
