import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  slug: string;
  categoryId?: { name: string; _id: string };
  isActive: boolean;
  isFeatured: boolean;
  description?: string;
  shortDescription?: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export function AdminProducts() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', shortDescription: '', categoryId: '', isFeatured: false });

  const { data, isLoading, refetch } = useQuery<{ success: boolean; data: Product[]; meta: { total: number; totalPages: number } }>({
    queryKey: ['admin-products', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/products?${params}`);
      return res.json();
    },
  });

  const { data: catData } = useQuery<{ success: boolean; data: Category[] }>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await fetch('/api/products/categories/all');
      return res.json();
    },
  });

  const products = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const categories = catData?.data ?? [];

  const openCreate = () => { setFormData({ name: '', slug: '', description: '', shortDescription: '', categoryId: '', isFeatured: false }); setEditingItem(null); setShowModal(true); };
  const openEdit = (item: Product) => { setEditingItem(item); setFormData({ name: item.name, slug: item.slug, description: item.description || '', shortDescription: item.shortDescription || '', categoryId: item.categoryId?._id || '', isFeatured: item.isFeatured }); setShowModal(true); };

  const handleSave = async () => {
    const token = localStorage.getItem('bark_auth_token');
    const slug = editingItem
      ? editingItem.slug
      : formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const payload = {
      ...formData,
      slug,
      summary: formData.shortDescription || formData.description || '',
    };
    const url = editingItem ? `/api/products/${editingItem._id}` : '/api/products';
    const method = editingItem ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (res.ok) { setShowModal(false); refetch(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const token = localStorage.getItem('bark_auth_token');
    await fetch(`/api/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black dark:text-white">Products ({total})</h2>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Product</Button>
      </div>
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
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
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Featured</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-3 font-medium text-black dark:text-white">{product.name}</td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">{product.categoryId?.name || 'N/A'}</td>
                      <td className="py-3">{product.isFeatured ? <span className="text-xs bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300 text-yellow-700 px-2 py-1 rounded-full">Featured</span> : <span className="text-gray-400">-</span>}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${product.isActive ? 'bg-green-100 dark:bg-green-900 dark:text-green-300 text-green-700' : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-400 text-gray-700'}`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(product)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(product._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">No products found</td></tr>}
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
              <h3 className="text-lg font-bold text-black dark:text-white">{editingItem ? 'Edit' : 'Add'} Product</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-sm font-medium text-black dark:text-white">Product Name</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Product name" className="mt-1" /></div>
              <div><label className="text-sm font-medium text-black dark:text-white">Short Description</label><Input value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} placeholder="Brief description" className="mt-1" /></div>
              <div><label className="text-sm font-medium text-black dark:text-white">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Full description" className="mt-1 flex min-h-[100px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-black dark:text-white" /></div>
              <div>
                <label className="text-sm font-medium text-black dark:text-white">Category</label>
                <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="mt-1 flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-black dark:text-white">
                  <option value="">Select category</option>
                  {categories.map((cat) => (<option key={cat._id} value={cat._id}>{cat.name}</option>))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="featured" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} className="rounded" />
                <label htmlFor="featured" className="text-sm font-medium text-black dark:text-white">Featured Product</label>
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
