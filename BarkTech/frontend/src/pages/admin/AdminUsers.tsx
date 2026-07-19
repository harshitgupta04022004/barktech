import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash2, Shield, X } from 'lucide-react';

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  client: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
};

const roles = ['super_admin', 'admin', 'client'];

export function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<User | null>(null);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'client' });

  const { data, isLoading, refetch } = useQuery<{ success: boolean; data: User[]; meta: { total: number } }>({
    queryKey: ['admin-users', page, roleFilter],
    queryFn: async () => {
      const token = localStorage.getItem('bark_auth_token');
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (roleFilter !== 'all') params.set('role', roleFilter);
      const res = await fetch(`/api/users?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) return { success: false, data: [], meta: { total: 0 } };
      return res.json();
    },
  });

  const users = data?.data ?? [];
  const filtered = search
    ? users.filter((u) => (u.fullName || '').toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    : users;
  const total = data?.meta?.total ?? 0;

  const openCreate = () => { setFormData({ fullName: '', email: '', password: '', role: 'client' }); setEditingItem(null); setShowModal(true); };
  const openEdit = (item: User) => { setEditingItem(item); setFormData({ fullName: item.fullName || '', email: item.email, password: '', role: item.role }); setShowModal(true); };

  const handleSave = async () => {
    const token = localStorage.getItem('bark_auth_token');
    if (editingItem) {
      await fetch(`/api/users/${editingItem._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fullName: formData.fullName, email: formData.email }),
      });
      if (formData.role !== editingItem.role) {
        await fetch(`/api/users/${editingItem._id}/role`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ role: formData.role }),
        });
      }
    } else {
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    }
    setShowModal(false);
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this user?')) return;
    const token = localStorage.getItem('bark_auth_token');
    await fetch(`/api/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black dark:text-white">User Management ({total})</h2>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add User</Button>
      </div>

      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', ...roles].map((r) => (
                <Button key={r} variant={roleFilter === r ? 'default' : 'outline'} size="sm" onClick={() => { setRoleFilter(r); setPage(1); }} className="dark:border-gray-600">
                  {r === 'all' ? 'All' : r.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
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
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Last Login</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user._id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {(user.fullName || user.email)?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-black dark:text-white">{user.fullName || user.email}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${roleColors[user.role] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                          <Shield className="inline h-3 w-3 mr-1" />
                          {user.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${user.isActive ? 'bg-green-100 dark:bg-green-900 dark:text-green-300 text-green-700' : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-400 text-gray-700'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-IN') : 'Never'}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(user)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(user._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">No users found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black dark:text-white">{editingItem ? 'Edit' : 'Add'} User</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-sm font-medium text-black dark:text-white">Full Name</label><Input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="John Doe" className="mt-1" /></div>
              <div><label className="text-sm font-medium text-black dark:text-white">Email</label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="user@example.com" className="mt-1" disabled={!!editingItem} /></div>
              {!editingItem && <div><label className="text-sm font-medium text-black dark:text-white">Password</label><Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Min 8 characters" className="mt-1" /></div>}
              <div>
                <label className="text-sm font-medium text-black dark:text-white">Role</label>
                <div className="flex gap-2 mt-2">
                  {roles.map((r) => (
                    <button key={r} type="button" onClick={() => setFormData({ ...formData, role: r })}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${formData.role === r ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                      {r.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!formData.fullName || !formData.email || (!editingItem && !formData.password)}>{editingItem ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
