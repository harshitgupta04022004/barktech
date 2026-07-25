import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Clock, Globe, Phone, Mail, Bot, Users, ChevronDown, ChevronUp, Send } from 'lucide-react';

interface Lead {
  _id: string; name: string; email: string; phone?: string; company?: string;
  status: string; priority: string; source: string;
  rfqItems?: { productName: string; quantity: number }[];
  createdAt: string; updatedAt: string;
}

interface LeadStats { byStatus: Record<string, number>; bySource: Record<string, number>; total: number; }

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  contacted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  qualified: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  quoted: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  won: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  spam: 'bg-muted text-muted-foreground',
};

const priorityColors: Record<string, string> = {
  low: 'text-muted-foreground', normal: 'text-muted-foreground',
  medium: 'text-yellow-600 dark:text-yellow-400', high: 'text-orange-600 dark:text-orange-400',
  urgent: 'text-red-600 dark:text-red-400',
};

const sourceIconMap: Record<string, typeof Globe> = {
  web_form: Globe, rfq: Users, ai_chat: Bot, whatsapp: Phone,
  phone: Phone, email: Mail, ad_campaign: Globe,
};

export function AdminLeads() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  const { data: statsData } = useQuery<LeadStats>({
    queryKey: ['admin-lead-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('bark_auth_token');
      const res = await fetch('/api/leads/stats', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) return { byStatus: {}, bySource: {}, total: 0 };
      const json = await res.json();
      return json.data ?? json;
    },
  });

  const { data, isLoading } = useQuery<{ success: boolean; data: Lead[]; meta: { total: number } }>({
    queryKey: ['admin-leads', page, statusFilter],
    queryFn: async () => {
      const token = localStorage.getItem('bark_auth_token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/leads?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) return { success: false, data: [], meta: { total: 0 } };
      return res.json();
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = localStorage.getItem('bark_auth_token');
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-lead-stats'] });
    },
  });

  const leads = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const filtered = search ? leads.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase())) : leads;

  const pipelineStages = [
    { key: 'new', label: 'New', count: statsData?.byStatus?.['new'] ?? 0, color: '#3B82F6' },
    { key: 'contacted', label: 'Contacted', count: statsData?.byStatus?.['contacted'] ?? 0, color: '#EAB308' },
    { key: 'qualified', label: 'Qualified', count: statsData?.byStatus?.['qualified'] ?? 0, color: '#22C55E' },
    { key: 'quoted', label: 'Quoted', count: statsData?.byStatus?.['quoted'] ?? 0, color: '#A855F7' },
    { key: 'won', label: 'Won', count: statsData?.byStatus?.['won'] ?? 0, color: '#10B981' },
    { key: 'lost', label: 'Lost', count: statsData?.byStatus?.['lost'] ?? 0, color: '#EF4444' },
  ];
  const maxCount = Math.max(...pipelineStages.map((s) => s.count), 1);
  const pipelineTotal = statsData?.total ?? 0;

  const stalledLeads = leads.filter((l) => {
    const days = (Date.now() - new Date(l.updatedAt || l.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return days > 7 && !['won', 'lost', 'spam'].includes(l.status);
  });

  const sourceStats = statsData?.bySource ?? {};

  const kpiCards = [
    { title: 'Total Pipeline', value: pipelineTotal, subtitle: 'All leads', color: 'text-foreground', border: '' },
    { title: 'New', value: statsData?.byStatus?.['new'] ?? 0, subtitle: 'Needs first contact', color: 'text-blue-600', border: 'border-l-4 border-l-blue-500' },
    { title: 'Contacted', value: statsData?.byStatus?.['contacted'] ?? 0, subtitle: 'Awaiting response', color: 'text-yellow-600', border: 'border-l-4 border-l-yellow-500' },
    { title: 'Qualified', value: statsData?.byStatus?.['qualified'] ?? 0, subtitle: 'Ready for quote', color: 'text-green-600', border: 'border-l-4 border-l-green-500' },
    { title: 'Won', value: statsData?.byStatus?.['won'] ?? 0, subtitle: 'Converted', color: 'text-purple-600', border: 'border-l-4 border-l-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Leads & Inquiries ({total})</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className={kpi.border}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{kpi.title}</p>
              <p className={`text-2xl font-bold ${kpi.color} mt-1`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Pipeline Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pipelineStages.map((stage) => (
              <div key={stage.key} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 text-right shrink-0">{stage.label}</span>
                <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                  <div className="h-6 rounded-full flex items-center pl-2 transition-all duration-500" style={{ width: `${Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 8 : 0)}%`, backgroundColor: stage.color }}>
                    {stage.count > 0 && <span className="text-xs font-bold text-white">{stage.count}</span>}
                  </div>
                </div>
                <span className="text-xs font-medium text-foreground w-8">{stage.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Conversion Rates</p>
            <div className="flex gap-4 text-xs flex-wrap">
              <span>Contact Rate: <strong className="text-foreground">{pipelineTotal > 0 ? Math.round(((statsData?.byStatus?.['contacted'] ?? 0) / pipelineTotal) * 100) : 0}%</strong></span>
              <span>Win Rate: <strong className="text-foreground">{(statsData?.byStatus?.['qualified'] ?? 0) > 0 ? Math.round(((statsData?.byStatus?.['won'] ?? 0) / (statsData?.byStatus?.['qualified'] ?? 1)) * 100) : 0}%</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Needs Attention ({stalledLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stalledLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No stalled leads — great!</p>
            ) : (
              <div className="space-y-3">
                {stalledLeads.slice(0, 5).map((lead) => {
                  const days = Math.round((Date.now() - new Date(lead.updatedAt || lead.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={lead._id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                      <div>
                        <p className="text-sm font-medium text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.status} · {days} days ago</p>
                      </div>
                      <span className="text-xs text-orange-500 font-medium">⚠ {days}d</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(sourceStats).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No source data</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(sourceStats).sort(([, a], [, b]) => b - a).map(([source, count]) => {
                  const Icon = sourceIconMap[source] || Globe;
                  return (
                    <div key={source} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground capitalize">{source.replace(/_/g, ' ')}</span>
                          <span className="text-xs text-muted-foreground">{count} leads</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                          <div className="h-1.5 rounded-full bg-orange-500" style={{ width: `${(count / pipelineTotal) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'new', 'contacted', 'qualified', 'quoted', 'won', 'lost'].map((s) => (
                <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter(s); setPage(1); }}>
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Product / RFQ</th>
                    <th className="pb-3 font-medium">Source</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Priority</th>
                    <th className="pb-3 font-medium">Days</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => {
                    const daysSince = Math.round((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                    const isStalled = daysSince > 7 && !['won', 'lost', 'spam'].includes(lead.status);
                    const isExpanded = expandedLead === lead._id;
                    return [
                      <tr key={lead._id} className={`border-b border-border last:border-0 cursor-pointer hover:bg-accent ${isStalled ? 'bg-orange-50/30 dark:bg-orange-950/10' : ''}`} onClick={() => setExpandedLead(isExpanded ? null : lead._id)}>
                        <td className="py-3"><div className="font-medium text-foreground">{lead.name}</div><div className="text-xs text-muted-foreground">{lead.email}</div></td>
                        <td className="py-3 text-muted-foreground text-xs max-w-[200px] truncate">{lead.rfqItems?.map((r) => r.productName).join(', ') || '—'}</td>
                        <td className="py-3"><span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">{lead.source?.replace(/_/g, ' ') || '—'}</span></td>
                        <td className="py-3" onClick={(e) => e.stopPropagation()}>
                          <select value={lead.status} onChange={(e) => statusMutation.mutate({ id: lead._id, status: e.target.value })} className={`rounded-full px-2 py-0.5 text-xs font-medium border-0 cursor-pointer ${statusColors[lead.status] || 'bg-gray-100 text-gray-700'}`}>
                            {['new', 'contacted', 'qualified', 'quoted', 'won', 'lost', 'spam'].map((s) => (<option key={s} value={s}>{s}</option>))}
                          </select>
                        </td>
                        <td className="py-3"><span className={`text-xs font-medium capitalize ${priorityColors[lead.priority] || ''}`}>{lead.priority === 'urgent' ? '🔴 ' : lead.priority === 'high' ? '🟠 ' : lead.priority === 'medium' ? '🟡 ' : ''}{lead.priority}</span></td>
                        <td className="py-3"><span className={`text-xs ${isStalled ? 'text-orange-600 font-medium' : 'text-muted-foreground'}`}>{daysSince}d{isStalled && ' ⚠'}</span></td>
                        <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedLead(isExpanded ? null : lead._id)} title="Expand">{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Email"><Send className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>,
                      isExpanded && (
                        <tr key={`${lead._id}-expanded`}>
                          <td colSpan={7} className="p-4 bg-muted">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div><span className="text-muted-foreground block mb-1">Contact</span><div className="text-foreground">{lead.phone || 'No phone'}</div><div className="text-foreground">{lead.company || 'No company'}</div></div>
                              <div><span className="text-muted-foreground block mb-1">RFQ Items</span>{lead.rfqItems?.map((item, i) => (<div key={i} className="text-foreground">{item.productName} x{item.quantity}</div>)) || <span className="text-muted-foreground">None</span>}</div>
                              <div><span className="text-muted-foreground block mb-1">Timeline</span><div className="text-foreground">Created: {new Date(lead.createdAt).toLocaleDateString('en-IN')}</div></div>
                              <div><span className="text-muted-foreground block mb-1">Quick Actions</span><div className="flex gap-2"><Button size="sm" variant="outline">Send Email</Button><Button size="sm" variant="outline">Create Quote</Button></div></div>
                            </div>
                          </td>
                        </tr>
                      ),
                    ];
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
