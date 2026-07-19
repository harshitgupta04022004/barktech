import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, Sparkles, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function getToken(): string | null {
  return localStorage.getItem('bark_auth_token') || localStorage.getItem('bark_auth_token');
}

export function AdminAI() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am the **Bark Technologies Admin AI**. I can help you with:\n\n- **Product management** — search, specs, inventory\n- **Lead management** — create and track inquiries\n- **Invoice operations** — create invoices, view stats\n- **Business analytics** — get insights on your data\n\nHow can I assist you today?' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: healthData } = useQuery({
    queryKey: ['agent-health'],
    queryFn: async () => {
      try {
        const res = await fetch('/agent/health');
        return res.json();
      } catch {
        return { status: 'unreachable' };
      }
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const token = getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/agent/admin/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userMsg }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const errorMsg = errorBody.detail || errorBody.error || `Agent request failed (${res.status})`;
        setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${errorMsg}` }]);
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream')) {
        // SSE streaming response
        const reader = res.body?.getReader();
        if (!reader) {
          setMessages((prev) => [...prev, { role: 'assistant', content: 'Error: No response stream' }]);
          return;
        }
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.trim() === '[DONE]') continue;
            const dataMatch = line.match(/^data:\s*(.+)$/s);
            if (!dataMatch) continue;
            const data = dataMatch[1].trim();
            if (data && data !== '[DONE]') {
              fullContent += data;
            }
          }
        }
        if (buffer.trim() === '[DONE]') {
          // trailing done
        }
        setMessages((prev) => [...prev, { role: 'assistant', content: fullContent || 'No response received.' }]);
      } else {
        // JSON response
        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response || 'No response received.' }]);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Error connecting to AI agent. Please check:\n1. Agent service is running on port 8000\n2. You are logged in as admin\n3. Try again in a moment',
      }]);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading]);

  const clearChat = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setMessages([
      { role: 'assistant', content: 'Chat cleared. How can I help you?' },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-black dark:text-white">AI Agent</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${healthData?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-gray-600 dark:text-gray-400">{healthData?.status === 'ok' ? 'Agent Online' : 'Agent Offline'}</span>
          </div>
          <Button variant="outline" size="sm" onClick={clearChat}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      <Card className="dark:bg-gray-900 dark:border-gray-800" style={{ height: 'calc(100vh - 240px)', minHeight: '400px' }}>
        <div className="flex h-full flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start gap-2 max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-1">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`rounded-xl px-4 py-3 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-100 text-gray-900 rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-strong:font-semibold prose-code:text-xs prose-code:bg-gray-200 dark:prose-code:bg-gray-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-1">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-xl rounded-bl-sm px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t dark:border-gray-700 p-4 flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask the AI agent anything..."
              className="flex-1 dark:bg-gray-800 dark:border-gray-600"
              disabled={isLoading}
            />
            <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
