import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, Filter, Clock } from 'lucide-react';

interface AuditLog {
  _id: string;
  user: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  login: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  logout: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  export: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
};

export function AdminAudit() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ success: boolean; data: AuditLog[]; meta: { total: number } }>({
    queryKey: ['admin-audit', page, actionFilter, dateFrom, dateTo],
    queryFn: async () => {
      const token = localStorage.getItem('bark_auth_token');
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      const res = await fetch(`/api/audit?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return { success: false, data: [], meta: { total: 0 } };
      return res.json();
    },
  });

  const logs = data?.data ?? [];
  const filtered = search
    ? logs.filter((l) => l.userName.toLowerCase().includes(search.toLowerCase()) || l.resource.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase()))
    : logs;
  const total = data?.meta?.total ?? 0;

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Resource', 'Details', 'IP'].join(','),
      ...filtered.map((l) => [
        l.createdAt,
        l.userName,
        l.action,
        l.resource,
        l.details || '',
        l.ipAddress || '',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black dark:text-white">Audit Logs ({total})</h2>
        <Button variant="outline" onClick={handleExport} className="dark:border-gray-600">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by user, action, or resource..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 dark:bg-gray-800 dark:border-gray-600"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <select
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  <option value="all">All Actions</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="export">Export</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="dark:bg-gray-800 dark:border-gray-600 text-sm"
                />
                <span className="text-gray-500 dark:text-gray-400 text-sm">to</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="dark:bg-gray-800 dark:border-gray-600 text-sm"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-600 dark:text-gray-400">
                    <th className="pb-3 font-medium">Timestamp</th>
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Action</th>
                    <th className="pb-3 font-medium">Resource</th>
                    <th className="pb-3 font-medium">Details</th>
                    <th className="pb-3 font-medium">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => (
                    <tr key={log._id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 font-medium text-black dark:text-white">{log.userName}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${actionColors[log.action] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 text-gray-700 dark:text-gray-300">{log.resource}</td>
                      <td className="py-3 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{log.details || '-'}</td>
                      <td className="py-3 text-gray-500 dark:text-gray-500 font-mono text-xs">{log.ipAddress || '-'}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">No audit logs found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
