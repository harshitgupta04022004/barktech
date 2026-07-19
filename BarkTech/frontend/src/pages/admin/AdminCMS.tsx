import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash2, Newspaper, HelpCircle, Building2, BookOpen, X } from 'lucide-react';

type CMSTab = 'case-studies' | 'news' | 'blog' | 'faqs' | 'pages' | 'offices';

interface CMSItem {
  _id: string;
  title: string;
  slug?: string;
  status?: string;
  question?: string;
  featuredImage?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

const tabs: { key: CMSTab; label: string; icon: typeof BookOpen; singular: string }[] = [
  { key: 'case-studies', label: 'Case Studies', icon: BookOpen, singular: 'Case Study' },
  { key: 'news', label: 'News', icon: Newspaper, singular: 'News Article' },
  { key: 'blog', label: 'Blog', icon: Newspaper, singular: 'Blog Post' },
  { key: 'faqs', label: 'FAQs', icon: HelpCircle, singular: 'FAQ' },
  { key: 'pages', label: 'Pages', icon: BookOpen, singular: 'Page' },
  { key: 'offices', label: 'Offices', icon: Building2, singular: 'Office' },
];

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  published: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  archived: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
};

const endpointMap: Record<CMSTab, string> = {
  'case-studies': '/api/cms/case-studies',
  news: '/api/cms/news',
  blog: '/api/cms/blog',
  faqs: '/api/cms/faqs',
  pages: '/api/cms/pages',
  offices: '/api/cms/offices',
};

export function AdminCMS() {
  const [activeTab, setActiveTab] = useState<CMSTab>('case-studies');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CMSItem | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({ title: '', slug: '', content: '', excerpt: '', status: 'draft', question: '', answer: '', name: '', city: '', address: '', phone: '', email: '' });

  const { data, isLoading, refetch } = useQuery<{ success: boolean; data: CMSItem[]; meta: { total: number } }>({
    queryKey: ['admin-cms', activeTab, page],
    queryFn: async () => {
      const token = localStorage.getItem('bark_auth_token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      const res = await fetch(`${endpointMap[activeTab]}?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) return { success: false, data: [], meta: { total: 0 } };
      return res.json();
    },
  });

  const items = data?.data ?? [];
  const filtered = search ? items.filter((i) => (i.title || i.question || i.name || '').toLowerCase().includes(search.toLowerCase())) : items;
  const currentTab = tabs.find((t) => t.key === activeTab)!;

  const openCreate = () => { setFormData({ title: '', slug: '', content: '', excerpt: '', status: 'draft', question: '', answer: '', name: '', city: '', address: '', phone: '', email: '' }); setEditingItem(null); setShowModal(true); };
  const openEdit = (item: CMSItem) => { setEditingItem(item); setFormData({ title: item.title || '', slug: item.slug || '', content: item.content || '', excerpt: item.excerpt || '', status: item.status || 'draft', question: item.question || '', answer: item.answer || '', name: item.name || '', city: item.city || '', address: item.address || '', phone: item.phone || '', email: item.email || '' }); setShowModal(true); };

  const handleSave = async () => {
    const token = localStorage.getItem('bark_auth_token');
    const url = editingItem ? `${endpointMap[activeTab]}/${editingItem._id}` : endpointMap[activeTab];
    const method = editingItem ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(formData) });
    if (res.ok) { setShowModal(false); refetch(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    const token = localStorage.getItem('bark_auth_token');
    await fetch(`${endpointMap[activeTab]}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black dark:text-white">Content Management</h2>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> New {currentTab.singular}</Button>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-gray-200 dark:border-gray-700 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setPage(1); setSearch(''); }} className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.key ? 'bg-primary/10 text-primary dark:text-orange-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              <Icon className="h-4 w-4" />{tab.label}
            </button>
          );
        })}
      </div>

      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder={`Search ${currentTab.label.toLowerCase()}...`} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
          {isLoading ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-600 dark:text-gray-400">
                    <th className="pb-3 font-medium">{activeTab === 'faqs' ? 'Question' : activeTab === 'offices' ? 'Name' : 'Title'}</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item._id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-3 font-medium text-black dark:text-white">{item.title || item.question || item.name || 'Untitled'}</td>
                      <td className="py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[item.status || 'draft'] || statusColors.draft}`}>{item.status || 'draft'}</span></td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">{new Date(item.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">No items found. Click "New {currentTab.singular}" to create one.</td></tr>}
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
              <h3 className="text-lg font-bold text-black dark:text-white">{editingItem ? 'Edit' : 'New'} {currentTab.singular}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              {activeTab === 'faqs' ? (
                <>
                  <div><label className="text-sm font-medium text-black dark:text-white">Question</label><Input value={formData.question} onChange={(e) => setFormData({ ...formData, question: e.target.value })} className="mt-1" /></div>
                  <div><label className="text-sm font-medium text-black dark:text-white">Answer</label><textarea value={formData.answer} onChange={(e) => setFormData({ ...formData, answer: e.target.value })} className="mt-1 flex min-h-[100px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-black dark:text-white" /></div>
                </>
              ) : activeTab === 'offices' ? (
                <>
                  <div><label className="text-sm font-medium text-black dark:text-white">Office Name</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1" /></div>
                  <div><label className="text-sm font-medium text-black dark:text-white">City</label><Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="mt-1" /></div>
                  <div><label className="text-sm font-medium text-black dark:text-white">Address</label><textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="mt-1 flex min-h-[80px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-black dark:text-white" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium text-black dark:text-white">Phone</label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1" /></div>
                    <div><label className="text-sm font-medium text-black dark:text-white">Email</label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1" /></div>
                  </div>
                </>
              ) : (
                <>
                  <div><label className="text-sm font-medium text-black dark:text-white">Title</label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="mt-1" /></div>
                  {activeTab !== 'pages' && <div><label className="text-sm font-medium text-black dark:text-white">Excerpt</label><Input value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} className="mt-1" /></div>}
                  <div><label className="text-sm font-medium text-black dark:text-white">Content</label><textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="mt-1 flex min-h-[150px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-black dark:text-white" /></div>
                  <div><label className="text-sm font-medium text-black dark:text-white">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="mt-1 flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-black dark:text-white"><option value="draft">Draft</option><option value="published">Published</option></select></div>
                </>
              )}
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
