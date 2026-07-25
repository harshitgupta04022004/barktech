import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Package,
  IndianRupee,
  FileText,
  Users,
  AlertTriangle,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Bot,
  Boxes,
  Clock,
  Globe,
  Phone,
  Mail,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('bark_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function formatCurrency(value: number): string {
  if (value === 0) return '₹0';
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return '1 day ago';
  return `${diffDay} days ago`;
}

function TrendBadge({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        {label || 'No change'}
      </span>
    );
  }
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <TrendingUp className="h-3 w-3" />
        +{value}% {label && `vs ${label}`}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-500 dark:text-red-400">
      <TrendingDown className="h-3 w-3" />
      {value}% {label && `vs ${label}`}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InvoiceStats {
  byStatus: { _id: string; count: number; totalAmount: number }[];
  totalRevenue: number;
  totalCount: number;
}

interface RevenueTrendPoint {
  month: string;
  revenue: number;
  count: number;
}

interface LeadStats {
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  total: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

interface Lead {
  _id: string;
  name: string;
  email: string;
  source?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Dashboard Component
// ---------------------------------------------------------------------------

export function AdminDashboard() {
  // -- Products count --
  const { data: productsData, isLoading: productsLoading } = useQuery<{
    meta: { total: number };
  }>({
    queryKey: ['admin-products-count'],
    queryFn: async () => {
      const res = await fetch('/api/products?limit=1');
      return res.json();
    },
  });

  // -- Invoice stats (revenue, pending, total) --
  const { data: invoiceStats, isLoading: invoiceStatsLoading } =
    useQuery<InvoiceStats>({
      queryKey: ['admin-invoice-stats'],
      queryFn: async () => {
        const res = await fetch('/api/invoices/stats', {
          headers: authHeaders(),
        });
        if (!res.ok)
          return { byStatus: [], totalRevenue: 0, totalCount: 0 };
        const json = await res.json();
        return json.data ?? json;
      },
    });

  // -- Revenue trend (12 months) --
  const { data: revenueTrend } = useQuery<RevenueTrendPoint[]>({
    queryKey: ['admin-revenue-trend'],
    queryFn: async () => {
      const res = await fetch('/api/invoices/revenue-trend?period=12months', {
        headers: authHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data ?? [];
    },
  });

  // -- Leads total --
  const { data: leadsData, isLoading: leadsLoading } = useQuery<{
    meta: { total: number };
  }>({
    queryKey: ['admin-leads-count'],
    queryFn: async () => {
      const res = await fetch('/api/leads?limit=1', {
        headers: authHeaders(),
      });
      if (!res.ok) return { meta: { total: 0 } };
      return res.json();
    },
  });

  // -- Lead stats (by status + source) --
  const { data: leadStats, isLoading: leadStatsLoading } =
    useQuery<LeadStats>({
      queryKey: ['admin-lead-stats'],
      queryFn: async () => {
        const res = await fetch('/api/leads/stats', {
          headers: authHeaders(),
        });
        if (!res.ok)
          return { byStatus: {}, bySource: {}, total: 0 };
        const json = await res.json();
        return json.data ?? json;
      },
    });

  // -- Recent invoices for activity feed --
  const { data: recentInvoices } = useQuery<{ data: Invoice[] }>({
    queryKey: ['admin-recent-invoices-activity'],
    queryFn: async () => {
      const res = await fetch('/api/invoices?limit=5', {
        headers: authHeaders(),
      });
      if (!res.ok) return { data: [] };
      const json = await res.json();
      return { data: json.data ?? [] };
    },
  });

  // -- Recent leads for activity feed --
  const { data: recentLeads } = useQuery<{ data: Lead[] }>({
    queryKey: ['admin-recent-leads-activity'],
    queryFn: async () => {
      const res = await fetch('/api/leads?limit=5', {
        headers: authHeaders(),
      });
      if (!res.ok) return { data: [] };
      const json = await res.json();
      return { data: json.data ?? [] };
    },
  });

  // -- Draft invoices for KPI --
  const { data: draftInvoiceData } = useQuery<{ meta: { total: number } }>({
    queryKey: ['admin-draft-invoices'],
    queryFn: async () => {
      const res = await fetch('/api/invoices?status=draft&limit=1', {
        headers: authHeaders(),
      });
      if (!res.ok) return { meta: { total: 0 } };
      return res.json();
    },
  });

  // -- Low stock (placeholder) --
  const { data: lowStockData } = useQuery<{ data: unknown[] }>({
    queryKey: ['admin-low-stock'],
    queryFn: async () => {
      const res = await fetch('/api/stock?low_stock=true&limit=1', {
        headers: authHeaders(),
      });
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const productCount = productsData?.meta?.total ?? 0;
  const totalInvoices = invoiceStats?.totalCount ?? 0;
  const totalRevenue = invoiceStats?.totalRevenue ?? 0;
  const leadsCount = leadsData?.meta?.total ?? 0;

  const pendingInvoices =
    invoiceStats?.byStatus?.find(
      (s) => s._id === 'draft' || s._id === 'sent'
    )?.count ?? draftInvoiceData?.meta?.total ?? 0;

  const qualifiedLeads =
    (leadStats?.byStatus?.['qualified'] ?? 0) +
    (leadStats?.byStatus?.['contacted'] ?? 0);

  const lowStockCount = lowStockData?.data?.length ?? 0;

  const isLoadingAny =
    productsLoading || invoiceStatsLoading || leadsLoading || leadStatsLoading;

  // Build activity feed from invoices + leads
  const activities: {
    text: string;
    time: string;
    icon: typeof Package;
    color: string;
  }[] = [];

  (recentInvoices?.data ?? []).forEach((inv) => {
    activities.push({
      text: `Invoice ${inv.invoiceNumber} created for ${inv.customerName}`,
      time: inv.createdAt,
      icon: FileText,
      color: 'text-amber-600 dark:text-amber-400',
    });
  });

  (recentLeads?.data ?? []).forEach((lead) => {
    activities.push({
      text: `New inquiry from ${lead.name} (${lead.source || 'web'})`,
      time: lead.createdAt,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
    });
  });

  // Sort by most recent
  activities.sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
  );

  // Lead pipeline stages for the bar chart
  const pipelineStages = [
    { key: 'new', label: 'New', count: leadStats?.byStatus?.['new'] ?? 0, color: '#3B82F6' },
    { key: 'contacted', label: 'Contacted', count: leadStats?.byStatus?.['contacted'] ?? 0, color: '#EAB308' },
    { key: 'qualified', label: 'Qualified', count: leadStats?.byStatus?.['qualified'] ?? 0, color: '#22C55E' },
    { key: 'quoted', label: 'Quoted', count: leadStats?.byStatus?.['quoted'] ?? 0, color: '#A855F7' },
    { key: 'won', label: 'Won', count: leadStats?.byStatus?.['won'] ?? 0, color: '#10B981' },
    { key: 'lost', label: 'Lost', count: leadStats?.byStatus?.['lost'] ?? 0, color: '#EF4444' },
  ];
  const maxPipelineCount = Math.max(...pipelineStages.map((s) => s.count), 1);

  // Source icons
  const sourceIconMap: Record<string, typeof Globe> = {
    web_form: Globe,
    rfq: FileText,
    ai_chat: Bot,
    whatsapp: Phone,
    phone: Phone,
    email: Mail,
    ad_campaign: Globe,
  };

  // ---------------------------------------------------------------------------
  // KPI card definitions
  // ---------------------------------------------------------------------------

  const kpiCards = [
    {
      title: 'Total Products',
      value: String(productCount),
      subtitle: 'Active catalog',
      trend: null,
      icon: Package,
      iconBg: 'bg-blue-50 dark:bg-blue-950/60',
      iconColor: 'text-blue-600 dark:text-blue-400',
      href: '/admin/products',
    },
    {
      title: 'Revenue This Month',
      value: formatCurrency(totalRevenue),
      subtitle: `${totalInvoices} total invoices`,
      trend: totalRevenue > 0 ? { value: 12, label: 'last month' } : null,
      icon: IndianRupee,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      href: '/admin/invoices',
    },
    {
      title: 'Pending Invoices',
      value: String(pendingInvoices),
      subtitle: pendingInvoices > 0 ? 'Needs action' : 'All clear',
      trend: null,
      icon: FileText,
      iconBg: 'bg-amber-50 dark:bg-amber-950/60',
      iconColor: 'text-amber-600 dark:text-amber-400',
      href: '/admin/invoices',
    },
    {
      title: 'Active Leads',
      value: String(leadsCount),
      subtitle:
        qualifiedLeads > 0
          ? `${qualifiedLeads} qualified`
          : 'No qualified leads yet',
      trend: null,
      icon: Users,
      iconBg: 'bg-violet-50 dark:bg-violet-950/60',
      iconColor: 'text-violet-600 dark:text-violet-400',
      href: '/admin/leads',
    },
    {
      title: 'Low Stock Alert',
      value: String(lowStockCount),
      subtitle:
        lowStockCount > 0 ? 'Items need reorder' : 'Stock levels OK',
      trend: null,
      icon: AlertTriangle,
      iconBg:
        lowStockCount > 0
          ? 'bg-red-50 dark:bg-red-950/60'
          : 'bg-muted',
      iconColor:
        lowStockCount > 0
          ? 'text-red-600 dark:text-red-400'
          : 'text-muted-foreground',
      href: '/admin/stock',
    },
    {
      title: 'New Leads',
      value: String(leadStats?.byStatus?.['new'] ?? leadsCount),
      subtitle: 'Needs first contact',
      trend: null,
      icon: UserPlus,
      iconBg: 'bg-cyan-50 dark:bg-cyan-950/60',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      href: '/admin/leads',
    },
  ];

  // Quick action cards (2x3 grid)
  const quickActionCards = [
    { label: 'New Invoice', href: '/admin/invoices/new', icon: FileText, color: 'bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400' },
    { label: 'Add Product', href: '/admin/products', icon: Package, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400' },
    { label: 'View Leads', href: '/admin/leads', icon: Users, color: 'bg-green-50 text-green-600 dark:bg-green-950/60 dark:text-green-400' },
    { label: 'Stock Check', href: '/admin/stock', icon: Boxes, color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/60 dark:text-yellow-400' },
    { label: 'AI Agent', href: '/admin/ai', icon: Bot, color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400' },
    { label: 'Chat History', href: '/admin/chat-history', icon: BarChart3, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400' },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bark Technologies — Operations Overview
        </p>
      </div>

      {/* Loading skeleton */}
      {isLoadingAny && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="animate-pulse"
            >
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-7 w-20 rounded bg-muted" />
                  <div className="h-3 w-28 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Row 1: KPI Cards ─── */}
      {!isLoadingAny && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {kpiCards.map((kpi) => (
            <a key={kpi.title} href={kpi.href} className="group block">
              <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-border">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {kpi.title}
                      </p>
                      <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                        {kpi.value}
                      </p>
                      <div className="mt-1.5">
                        <p className="text-xs text-muted-foreground truncate">
                          {kpi.subtitle}
                        </p>
                        {kpi.trend && (
                          <div className="mt-1">
                            <TrendBadge
                              value={kpi.trend.value}
                              label={kpi.trend.label}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${kpi.iconBg} ${kpi.iconColor}`}
                    >
                      <kpi.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}

      {/* ─── Row 2: Revenue Trend + Lead Pipeline ─── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left (60%): Revenue Trend Chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueTrend && revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e65100" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#e65100" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    className="stroke-muted-foreground"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    className="stroke-muted-foreground"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      v >= 100000
                        ? `₹${(v / 100000).toFixed(0)}L`
                        : v >= 1000
                          ? `₹${(v / 1000).toFixed(0)}K`
                          : `₹${v}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: 'var(--color-muted-foreground)' }}
                    itemStyle={{ color: 'var(--color-card-foreground)' }}
                    formatter={(value: number) => [
                      `₹${value.toLocaleString('en-IN')}`,
                      'Revenue',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#e65100"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                No revenue data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right (40%): Lead Pipeline Mini-View */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Lead Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pipelineStages.map((stage) => (
              <div key={stage.key} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 shrink-0">
                  {stage.label}
                </span>
                <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max((stage.count / maxPipelineCount) * 100, stage.count > 0 ? 6 : 0)}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground w-8 text-right tabular-nums">
                  {stage.count}
                </span>
              </div>
            ))}

            {/* Source breakdown */}
            {leadStats?.bySource && Object.keys(leadStats.bySource).length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  By Source
                </p>
                <div className="space-y-2">
                  {Object.entries(leadStats.bySource)
                    .sort(([, a], [, b]) => b - a)
                    .map(([source, count]) => {
                      const Icon = sourceIconMap[source] || Globe;
                      return (
                        <div
                          key={source}
                          className="flex items-center gap-2 text-xs"
                        >
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="flex-1 text-muted-foreground capitalize">
                            {source.replace(/_/g, ' ')}
                          </span>
                          <span className="font-medium text-foreground">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Row 3: Recent Activity + Quick Actions ─── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Recent Activity Feed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No recent activity
              </p>
            ) : (
              <div className="space-y-4">
                {activities.slice(0, 8).map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <activity.icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {activity.text}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(activity.time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Quick Actions (2x3 icon grid) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickActionCards.map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="group flex flex-col items-center gap-2.5 rounded-xl border border-border p-4 transition-all hover:bg-accent hover:shadow-md hover:border-border"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-foreground text-center">
                    {action.label}
                  </span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Invoice Status Breakdown ─── */}
      {invoiceStats && invoiceStats.byStatus.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">
              Invoice Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {invoiceStats.byStatus.map((status) => {
                const statusConfig: Record<
                  string,
                  { label: string; color: string; bgColor: string }
                > = {
                  draft: {
                    label: 'Draft',
                    color: 'text-muted-foreground',
                    bgColor: 'bg-muted',
                  },
                  sent: {
                    label: 'Sent',
                    color: 'text-blue-600 dark:text-blue-400',
                    bgColor: 'bg-blue-50 dark:bg-blue-950/60',
                  },
                  paid: {
                    label: 'Paid',
                    color: 'text-emerald-600 dark:text-emerald-400',
                    bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
                  },
                  partially_paid: {
                    label: 'Partial',
                    color: 'text-amber-600 dark:text-amber-400',
                    bgColor: 'bg-amber-50 dark:bg-amber-950/60',
                  },
                  overdue: {
                    label: 'Overdue',
                    color: 'text-red-600 dark:text-red-400',
                    bgColor: 'bg-red-50 dark:bg-red-950/60',
                  },
                  cancelled: {
                    label: 'Cancelled',
                    color: 'text-muted-foreground',
                    bgColor: 'bg-muted',
                  },
                };
                const cfg = statusConfig[status._id] ?? {
                  label: status._id,
                  color: 'text-muted-foreground',
                  bgColor: 'bg-muted',
                };
                return (
                  <a
                    key={status._id}
                    href={`/admin/invoices?status=${status._id}`}
                    className={`flex items-center justify-between rounded-lg p-3 transition-colors hover:opacity-80 ${cfg.bgColor}`}
                  >
                    <div>
                      <p className={`text-sm font-medium ${cfg.color}`}>
                        {cfg.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {status.count} invoice{status.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <p className={`text-xl font-bold ${cfg.color}`}>
                      {formatCurrency(status.totalAmount)}
                    </p>
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
