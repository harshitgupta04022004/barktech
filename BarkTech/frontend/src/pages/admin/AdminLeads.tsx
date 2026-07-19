import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye } from 'lucide-react';

interface Lead {
  _id: string;
  contactName: string;
  email: string;
  phone?: string;
  company?: string;
  status: string;
  priority: string;
  source: string;
  rfqItems?: { productName: string; quantity: number }[];
  createdAt: string;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  contacted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  qualified: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  quoted: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  won: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const priorityColors: Record<string, string> = {
  low: 'text-gray-500 dark:text-gray-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  high: 'text-orange-600 dark:text-orange-400',
  urgent: 'text-red-600 dark:text-red-400',
};

export function AdminLeads() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ success: boolean; data: Lead[]; meta: { total: number } }>({
    queryKey: ['admin-leads', page, statusFilter],
    queryFn: async () => {
      const token = localStorage.getItem('bark_auth_token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/leads?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return { success: false, data: [], meta: { total: 0 } };
      return res.json();
    },
  });

  const leads = data?.data ?? [];
  const filtered = search ? leads.filter((l) => l.contactName.toLowerCase().includes(search.toLowerCase())) : leads;
  const total = data?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-black dark:text-white">Leads & Inquiries ({total})</h2>
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'new', 'contacted', 'qualified', 'quoted'].map((s) => (
                <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter(s); setPage(1); }} className="dark:border-gray-600">
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-600 dark:text-gray-400">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Source</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Priority</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr key={lead._id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-3"><div className="font-medium text-black dark:text-white">{lead.contactName}</div><div className="text-xs text-gray-500 dark:text-gray-400">{lead.email}</div></td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">{lead.rfqItems?.[0]?.productName || 'N/A'}</td>
                      <td className="py-3 text-gray-600 dark:text-gray-400 capitalize">{lead.source}</td>
                      <td className="py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[lead.status] || ''}`}>{lead.status}</span></td>
                      <td className="py-3"><span className={`text-xs font-medium capitalize ${priorityColors[lead.priority] || ''}`}>{lead.priority}</span></td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">{new Date(lead.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 text-right"><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
