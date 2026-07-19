import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, FileText, TrendingUp } from 'lucide-react';

export function AdminDashboard() {
  const { data: productsData } = useQuery<{ meta: { total: number } }>({
    queryKey: ['admin-products-count'],
    queryFn: async () => {
      const res = await fetch('/api/products?limit=1');
      return res.json();
    },
  });
  const { data: leadsData } = useQuery<{ meta: { total: number } }>({
    queryKey: ['admin-leads-count'],
    queryFn: async () => {
      const token = localStorage.getItem('bark_auth_token');
      const res = await fetch('/api/leads?limit=1', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return { meta: { total: 0 } };
      return res.json();
    },
  });
  const { data: invoicesData } = useQuery<{ meta: { total: number } }>({
    queryKey: ['admin-invoices-count'],
    queryFn: async () => {
      const token = localStorage.getItem('bark_auth_token');
      const res = await fetch('/api/invoices?limit=1', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return { meta: { total: 0 } };
      return res.json();
    },
  });

  const productCount = productsData?.meta?.total ?? 0;
  const leadsCount = leadsData?.meta?.total ?? 0;
  const invoicesCount = invoicesData?.meta?.total ?? 0;

  const stats = [
    { title: 'Total Products', value: String(productCount), icon: Package, change: 'Active products', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    { title: 'Active Leads', value: String(leadsCount), icon: Users, change: 'Customer inquiries', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
    { title: 'Invoices', value: String(invoicesCount), icon: FileText, change: 'Generated invoices', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
    { title: 'Revenue', value: 'On Request', icon: TrendingUp, change: 'Contact sales team', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-black dark:text-white">Dashboard Overview</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1 text-black dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.change}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader><CardTitle className="text-black dark:text-white">Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: 'View All Products', href: '/admin/products', desc: 'Manage product catalog' },
              { label: 'View All Leads', href: '/admin/leads', desc: 'Manage customer inquiries' },
              { label: 'View Invoices', href: '/admin/invoices', desc: 'View generated invoices' },
              { label: 'Analytics', href: '/admin/analytics', desc: 'View business analytics' },
              { label: 'AI Agent', href: '/admin/ai', desc: 'Chat with AI assistant' },
            ].map((action) => (
              <a key={action.label} href={action.href} className="block rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <p className="font-medium text-sm text-black dark:text-white">{action.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{action.desc}</p>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
