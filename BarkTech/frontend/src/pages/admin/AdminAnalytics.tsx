import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Package, Eye, Search } from 'lucide-react';

export function AdminAnalytics() {
  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('bark_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const { data: productsData } = useQuery<{ data: unknown[]; meta?: { total: number } }>({
    queryKey: ['analytics-products'],
    queryFn: async () => {
      const res = await fetch('/api/products?limit=100', { headers: getAuthHeaders() });
      return res.json();
    },
  });

  const { data: leadsData } = useQuery<{ data: unknown[]; meta?: { total: number } }>({
    queryKey: ['analytics-leads'],
    queryFn: async () => {
      const res = await fetch('/api/leads?limit=100', { headers: getAuthHeaders() });
      if (!res.ok) return { data: [], meta: { total: 0 } };
      return res.json();
    },
  });

  const { data: invoicesData } = useQuery<{ data: unknown[]; meta?: { total: number } }>({
    queryKey: ['analytics-invoices'],
    queryFn: async () => {
      const res = await fetch('/api/invoices?limit=100', { headers: getAuthHeaders() });
      if (!res.ok) return { data: [], meta: { total: 0 } };
      return res.json();
    },
  });

  const totalProducts = productsData?.meta?.total ?? productsData?.data?.length ?? 0;
  const totalLeads = leadsData?.meta?.total ?? leadsData?.data?.length ?? 0;
  const totalInvoices = invoicesData?.meta?.total ?? invoicesData?.data?.length ?? 0;

  const leadStatusCounts: Record<string, number> = {};
  (leadsData?.data ?? []).forEach((lead: any) => {
    const s = lead.status || 'unknown';
    leadStatusCounts[s] = (leadStatusCounts[s] || 0) + 1;
  });

  const invoiceStatusCounts: Record<string, number> = {};
  (invoicesData?.data ?? []).forEach((inv: any) => {
    const s = inv.status || 'unknown';
    invoiceStatusCounts[s] = (invoiceStatusCounts[s] || 0) + 1;
  });

  const maxLeadCount = Math.max(1, ...Object.values(leadStatusCounts));
  const maxInvoiceCount = Math.max(1, ...Object.values(invoiceStatusCounts));

  const overviewStats = [
    { label: 'Total Products', value: totalProducts, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Total Leads', value: totalLeads, icon: Users, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
    { label: 'Total Invoices', value: totalInvoices, icon: BarChart3, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
  ];

  const leadStatusColors: Record<string, string> = {
    new: 'bg-blue-500',
    contacted: 'bg-yellow-500',
    qualified: 'bg-green-500',
    quoted: 'bg-purple-500',
    won: 'bg-emerald-500',
    lost: 'bg-red-500',
  };

  const invoiceStatusColors: Record<string, string> = {
    draft: 'bg-gray-400',
    sent: 'bg-blue-500',
    paid: 'bg-green-500',
    overdue: 'bg-red-500',
    cancelled: 'bg-gray-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-black dark:text-white">Analytics</h2>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {overviewStats.map((stat) => (
          <Card key={stat.label} className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1 text-black dark:text-white">{stat.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead Status Breakdown */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-black dark:text-white">
              <Users className="h-4 w-4" />
              Lead Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(leadStatusCounts).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No lead data available yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(leadStatusCounts).map(([status, count]) => (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium text-black dark:text-white">{status}</span>
                      <span className="text-gray-600 dark:text-gray-400">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${leadStatusColors[status] || 'bg-gray-400'}`}
                        style={{ width: `${(count / maxLeadCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Status Breakdown */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-black dark:text-white">
              <BarChart3 className="h-4 w-4" />
              Invoice Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(invoiceStatusCounts).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No invoice data available yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(invoiceStatusCounts).map(([status, count]) => (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium text-black dark:text-white">{status}</span>
                      <span className="text-gray-600 dark:text-gray-400">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${invoiceStatusColors[status] || 'bg-gray-400'}`}
                        style={{ width: `${(count / maxInvoiceCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-black dark:text-white">
            <TrendingUp className="h-4 w-4" />
            Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <Eye className="h-5 w-5 mx-auto text-gray-500 dark:text-gray-400 mb-2" />
              <p className="text-2xl font-bold text-black dark:text-white">{totalProducts}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Products Listed</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <Search className="h-5 w-5 mx-auto text-gray-500 dark:text-gray-400 mb-2" />
              <p className="text-2xl font-bold text-black dark:text-white">{totalLeads}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Inquiries Received</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <BarChart3 className="h-5 w-5 mx-auto text-gray-500 dark:text-gray-400 mb-2" />
              <p className="text-2xl font-bold text-black dark:text-white">{totalInvoices}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Invoices Generated</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
