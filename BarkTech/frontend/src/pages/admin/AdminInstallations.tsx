import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, MapPin, Calendar, X } from 'lucide-react';

interface Installation {
  _id: string;
  clientName: string;
  machine: string;
  location: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'in-progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export function AdminInstallations() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Installation | null>(null);
  const [formData, setFormData] = useState({ clientName: '', machine: '', location: '', status: 'scheduled', scheduledDate: '', notes: '' });

  const { data, isLoading, refetch } = useQuery<{ success: boolean; data: Installation[]; meta: { total: number } }>({
    queryKey: ['admin-installations', page, statusFilter],
    queryFn: async () => {
      const token = localStorage.getItem('bark_auth_token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/installations?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) return { success: false, data: [], meta: { total: 0 } };
      return res.json();
    },
  });

  const installations = data?.data ?? [];
  const filtered = search
    ? installations.filter((i) => i.clientName.toLowerCase().includes(search.toLowerCase()) || i.machine.toLowerCase().includes(search.toLowerCase()) || i.location.toLowerCase().includes(search.toLowerCase()))
    : installations;
  const total = data?.meta?.total ?? 0;

  const openCreate = () => { setFormData({ clientName: '', machine: '', location: '', status: 'scheduled', scheduledDate: '', notes: '' }); setEditingItem(null); setShowModal(true); };
  const openEdit = (item: Installation) => { setEditingItem(item); setFormData({ clientName: item.clientName, machine: item.machine, location: item.location, status: item.status, scheduledDate: item.scheduledDate ? item.scheduledDate.split('T')[0] : '', notes: item.notes || '' }); setShowModal(true); };

  const handleSave = async () => {
    const token = localStorage.getItem('bark_auth_token');
    const url = editingItem ? `/api/installations/${editingItem._id}` : '/api/installations';
    const method = editingItem ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(formData),
    });
    if (res.ok) { setShowModal(false); refetch(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black dark:text-white">Installations ({total})</h2>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> New Installation</Button>
      </div>

      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search by client, machine, or location..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'scheduled', 'in-progress', 'completed'].map((s) => (
                <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter(s); setPage(1); }} className="dark:border-gray-600">
                  {s === 'all' ? 'All' : s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
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
                    <th className="pb-3 font-medium">Client</th>
                    <th className="pb-3 font-medium">Machine</th>
                    <th className="pb-3 font-medium">Location</th>
                    <th className="pb-3 font-medium">Scheduled</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inst) => (
                    <tr key={inst._id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-3 font-medium text-black dark:text-white">{inst.clientName}</td>
                      <td className="py-3 text-gray-700 dark:text-gray-300">{inst.machine}</td>
                      <td className="py-3"><div className="flex items-center gap-1 text-gray-600 dark:text-gray-400"><MapPin className="h-3 w-3" />{inst.location}</div></td>
                      <td className="py-3"><div className="flex items-center gap-1 text-gray-600 dark:text-gray-400"><Calendar className="h-3 w-3" />{inst.scheduledDate ? new Date(inst.scheduledDate).toLocaleDateString('en-IN') : 'Not set'}</div></td>
                      <td className="py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusColors[inst.status] || ''}`}>{inst.status}</span></td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(inst)}><Edit className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">No installations found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black dark:text-white">{editingItem ? 'Edit' : 'New'} Installation</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-sm font-medium text-black dark:text-white">Client Name</label><Input value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} placeholder="Client or company name" className="mt-1" /></div>
              <div><label className="text-sm font-medium text-black dark:text-white">Machine / Model</label><Input value={formData.machine} onChange={(e) => setFormData({ ...formData, machine: e.target.value })} placeholder="e.g. BT-120 Automatic Die Cutter" className="mt-1" /></div>
              <div><label className="text-sm font-medium text-black dark:text-white">Location</label><Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="City, State" className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-black dark:text-white">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="mt-1 flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-black dark:text-white">
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-black dark:text-white">Scheduled Date</label>
                  <Input type="date" value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-black dark:text-white">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." className="mt-1 flex min-h-[80px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-black dark:text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingItem ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
