import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash2, Send, Share2, X } from 'lucide-react';

interface Campaign {
  _id: string;
  title: string;
  platform: string;
  status: string;
  content?: string;
  hashtags?: string;
  scheduledDate?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  published: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
};

const platformColors: Record<string, string> = {
  facebook: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  instagram: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  linkedin: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
  twitter: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  email: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  all: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};

const platforms = ['facebook', 'instagram', 'linkedin', 'twitter', 'email', 'all'];

export function AdminCampaigns() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({ title: '', platform: 'all', content: '', hashtags: '', status: 'draft', scheduledDate: '' });

  const { data, isLoading, refetch } = useQuery<{ success: boolean; data: Campaign[]; meta: { total: number } }>({
    queryKey: ['admin-campaigns', page, statusFilter],
    queryFn: async () => {
      const token = localStorage.getItem('bark_auth_token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/campaigns?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) return { success: false, data: [], meta: { total: 0 } };
      return res.json();
    },
  });

  const campaigns = data?.data ?? [];
  const filtered = search ? campaigns.filter((c) => c.title.toLowerCase().includes(search.toLowerCase())) : campaigns;
  const total = data?.meta?.total ?? 0;

  const openCreate = () => { setFormData({ title: '', platform: 'all', content: '', hashtags: '', status: 'draft', scheduledDate: '' }); setEditingItem(null); setShowModal(true); };
  const openEdit = (item: Campaign) => { setEditingItem(item); setFormData({ title: item.title, platform: item.platform, content: item.content || '', hashtags: item.hashtags || '', status: item.status, scheduledDate: item.scheduledDate ? item.scheduledDate.split('T')[0] : '' }); setShowModal(true); };

  const handleSave = async () => {
    const token = localStorage.getItem('bark_auth_token');
    const url = editingItem ? `/api/campaigns/${editingItem._id}` : '/api/campaigns';
    const method = editingItem ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(formData) });
    if (res.ok) { setShowModal(false); refetch(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    const token = localStorage.getItem('bark_auth_token');
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    refetch();
  };

  const handlePublish = async (id: string) => {
    const token = localStorage.getItem('bark_auth_token');
    await fetch(`/api/campaigns/${id}/publish`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black dark:text-white">Campaigns ({total})</h2>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> New Campaign</Button>
      </div>

      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search campaigns..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'draft', 'scheduled', 'published', 'paused'].map((s) => (
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
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium">Platform</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Scheduled</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((campaign) => (
                    <tr key={campaign._id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-3 font-medium text-black dark:text-white">{campaign.title}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${platformColors[campaign.platform] || ''}`}>
                          <Share2 className="inline h-3 w-3 mr-1" />{campaign.platform}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusColors[campaign.status] || ''}`}>{campaign.status}</span>
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {campaign.scheduledDate ? new Date(campaign.scheduledDate).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">{new Date(campaign.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(campaign)}><Edit className="h-4 w-4" /></Button>
                          {campaign.status === 'draft' && <Button variant="ghost" size="icon" onClick={() => handlePublish(campaign._id)}><Send className="h-4 w-4 text-green-600" /></Button>}
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(campaign._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">No campaigns found</td></tr>}
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
              <h3 className="text-lg font-bold text-black dark:text-white">{editingItem ? 'Edit' : 'New'} Campaign</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-sm font-medium text-black dark:text-white">Campaign Title *</label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Campaign title" className="mt-1" /></div>
              <div>
                <label className="text-sm font-medium text-black dark:text-white">Platform</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {platforms.map((p) => (
                    <button key={p} type="button" onClick={() => setFormData({ ...formData, platform: p })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${formData.platform === p ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="text-sm font-medium text-black dark:text-white">Content *</label><textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Write your campaign content..." className="mt-1 flex min-h-[120px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-black dark:text-white" /></div>
              <div><label className="text-sm font-medium text-black dark:text-white">Hashtags</label><Input value={formData.hashtags} onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })} placeholder="#barktech #machinery" className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-black dark:text-white">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="mt-1 flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-black dark:text-white">
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-black dark:text-white">Schedule Date</label>
                  <Input type="date" value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} className="mt-1" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!formData.title || !formData.content}>{editingItem ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
