import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Clock, DollarSign, Zap, ChevronDown, ChevronUp } from 'lucide-react';

interface ChatLog {
  _id: string;
  sessionId: string;
  userEmail: string;
  userName: string;
  source: 'client' | 'admin';
  userMessage: string;
  assistantReply: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  speed?: number;
  latencyMs?: number;
  toolCalls: { name: string; input: string; output: string; success: boolean }[];
  createdAt: string;
}

const sourceColors: Record<string, string> = {
  client: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};

export function AdminChatHistory() {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ success: boolean; data: ChatLog[]; meta: { total: number } }>({
    queryKey: ['admin-chat-logs', page, sourceFilter],
    queryFn: async () => {
      const token = localStorage.getItem('bark_auth_token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      const res = await fetch(`/api/chat-logs/logs?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) return { success: false, data: [], meta: { total: 0 } };
      return res.json();
    },
  });

  const { data: statsData } = useQuery<{ success: boolean; data: { totalLogs: number; totalTokens: number; totalCost: number; avgLatency: number; toolCallsCount: number } }>({
    queryKey: ['admin-chat-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('bark_auth_token');
      const res = await fetch('/api/chat-logs/stats', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) return { success: false, data: { totalLogs: 0, totalTokens: 0, totalCost: 0, avgLatency: 0, toolCallsCount: 0 } };
      return res.json();
    },
  });

  const logs = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const stats = statsData?.data;

  const filtered = search
    ? logs.filter((l) =>
        (l.userEmail || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.userName || '').toLowerCase().includes(search.toLowerCase()) ||
        l.userMessage.toLowerCase().includes(search.toLowerCase()) ||
        l.assistantReply.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const formatCost = (cost: number) => cost > 0 ? `$${cost.toFixed(4)}` : '-';
  const formatLatency = (ms?: number) => ms ? `${(ms / 1000).toFixed(1)}s` : '-';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black dark:text-white">Chat Logs ({total})</h2>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Total Logs', value: stats.totalLogs, icon: MessageSquare, color: 'text-blue-500' },
            { label: 'Total Tokens', value: stats.totalTokens.toLocaleString(), icon: Zap, color: 'text-yellow-500' },
            { label: 'Total Cost', value: `$${stats.totalCost.toFixed(4)}`, icon: DollarSign, color: 'text-green-500' },
            { label: 'Avg Latency', value: `${(stats.avgLatency / 1000).toFixed(1)}s`, icon: Clock, color: 'text-purple-500' },
            { label: 'Tool Calls', value: stats.toolCallsCount, icon: Zap, color: 'text-orange-500' },
          ].map((stat) => (
            <Card key={stat.label} className="dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className="text-xl font-bold text-black dark:text-white">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search by user, email, or message content..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              {['all', 'client', 'admin'].map((s) => (
                <Button key={s} variant={sourceFilter === s ? 'default' : 'outline'} size="sm" onClick={() => { setSourceFilter(s); setPage(1); }} className="dark:border-gray-600">
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Logs List */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">Loading chat logs...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          <MessageSquare className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p>No chat logs found.</p>
          <p className="text-sm mt-1">Logs are saved automatically when users chat with the AI agent.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => {
            const isExpanded = expandedId === log._id;
            return (
              <Card key={log._id} className="dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
                <CardContent className="p-0">
                  {/* Header row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log._id)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-400">
                      {(log.userEmail || log.userName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm text-black dark:text-white truncate">
                          {log.userEmail || log.userName || 'Anonymous'}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sourceColors[log.source] || ''}`}>
                          {log.source}
                        </span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                          {log.model}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[500px]">
                        <span className="font-medium">User:</span> {log.userMessage}
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      <span>{formatLatency(log.latencyMs)}</span>
                      <span>{formatCost(log.cost)}</span>
                      <span>{log.toolCalls.length > 0 ? `${log.toolCalls.length} tools` : '-'}</span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(log.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
                      {/* User message */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">User Message</p>
                        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                          {log.userMessage}
                        </div>
                      </div>

                      {/* Assistant reply */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Assistant Reply</p>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {log.assistantReply}
                        </div>
                      </div>

                      {/* Tool calls */}
                      {log.toolCalls.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tool Calls ({log.toolCalls.length})</p>
                          <div className="space-y-2">
                            {log.toolCalls.map((tc, i) => (
                              <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`rounded px-1.5 py-0.5 font-mono font-medium ${tc.success ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                                    {tc.name}
                                  </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400"><span className="font-medium">Input:</span> {tc.input}</p>
                                <p className="text-gray-600 dark:text-gray-400 mt-1"><span className="font-medium">Output:</span> {tc.output?.substring(0, 200)}{tc.output?.length > 200 ? '...' : ''}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Meta info */}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>Session: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{log.sessionId}</code></span>
                        <span>Model: {log.model}</span>
                        {log.latencyMs && <span>Latency: {formatLatency(log.latencyMs)}</span>}
                        {log.cost > 0 && <span>Cost: {formatCost(log.cost)}</span>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Previous</Button>
              <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">Page {page}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={filtered.length < 20}>Next</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
