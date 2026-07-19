import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, AlertTriangle, X } from 'lucide-react';

interface StockItem {
  _id: string;
  productName: string;
  productId?: string;
  quantity: number;
  reserved: number;
  available: number;
  location: string;
  lowStockThreshold: number;
  updatedAt: string;
}

interface StockMovement {
  _id: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  reference: string;
  notes: string;
  performedBy: string;
  createdAt: string;
}

interface FormData {
  productName: string;
  quantity: string;
  reserved: string;
  location: string;
  lowStockThreshold: string;
}

const typeColors: Record<string, string> = {
  in: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  out: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  adjustment: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  transfer: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
};

function StockModal({
  title,
  formData,
  setFormData,
  editingItem,
  onSave,
  onClose,
}: {
  title: string;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  editingItem: StockItem | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const update = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-black dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-black dark:text-white">Product Name</label>
            <Input
              value={formData.productName}
              onChange={(e) => update('productName', e.target.value)}
              placeholder="Product name"
              disabled={!!editingItem}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-black dark:text-white">Quantity</label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => update('quantity', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-black dark:text-white">Reserved</label>
              <Input
                type="number"
                value={formData.reserved}
                onChange={(e) => update('reserved', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-black dark:text-white">Location</label>
            <Input
              value={formData.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="Warehouse / shelf"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-black dark:text-white">Low Stock Threshold</label>
            <Input
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) => update('lowStockThreshold', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave}>{editingItem ? 'Update' : 'Add'} Stock</Button>
        </div>
      </div>
    </div>
  );
}

export function AdminStock() {
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [formData, setFormData] = useState<FormData>({
    productName: '',
    quantity: '0',
    reserved: '0',
    location: '',
    lowStockThreshold: '5',
  });

  const { data: stockData, isLoading: stockLoading, refetch } = useQuery<{ success: boolean; data: StockItem[]; meta: { total: number } }>({
    queryKey: ['admin-stock', page, lowStockOnly],
    queryFn: async () => {
      const token = localStorage.getItem('bark_auth_token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (lowStockOnly) params.set('lowStock', 'true');
      const res = await fetch(`/api/stock?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) return { success: false, data: [], meta: { total: 0 } };
      return res.json();
    },
  });

  const { data: movementData, isLoading: movementLoading } = useQuery<{ success: boolean; data: StockMovement[]; meta: { total: number } }>({
    queryKey: ['admin-stock-movements', page],
    queryFn: async () => {
      const token = localStorage.getItem('bark_auth_token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      const res = await fetch(`/api/stock/movements?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) return { success: false, data: [], meta: { total: 0 } };
      return res.json();
    },
    enabled: activeTab === 'movements',
  });

  const stockItems = stockData?.data ?? [];
  const filteredStock = search
    ? stockItems.filter((s) => s.productName.toLowerCase().includes(search.toLowerCase()) || s.location.toLowerCase().includes(search.toLowerCase()))
    : stockItems;
  const movements = movementData?.data ?? [];

  const resetForm = () => {
    setFormData({ productName: '', quantity: '0', reserved: '0', location: '', lowStockThreshold: '5' });
  };

  const handleAddStock = async () => {
    const token = localStorage.getItem('bark_auth_token');
    const res = await fetch('/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        productName: formData.productName,
        quantity: Number(formData.quantity),
        reserved: Number(formData.reserved),
        location: formData.location,
        lowStockThreshold: Number(formData.lowStockThreshold),
      }),
    });
    if (res.ok) {
      setShowAddModal(false);
      resetForm();
      refetch();
    }
  };

  const handleEditStock = async () => {
    if (!editingItem) return;
    const token = localStorage.getItem('bark_auth_token');
    const res = await fetch(`/api/stock/${editingItem._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        quantity: Number(formData.quantity),
        reserved: Number(formData.reserved),
        location: formData.location,
        lowStockThreshold: Number(formData.lowStockThreshold),
      }),
    });
    if (res.ok) {
      setShowEditModal(false);
      setEditingItem(null);
      refetch();
    }
  };

  const openEditModal = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      productName: item.productName,
      quantity: String(item.quantity),
      reserved: String(item.reserved),
      location: item.location || '',
      lowStockThreshold: String(item.lowStockThreshold),
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black dark:text-white">Stock Management</h2>
        <Button onClick={() => { resetForm(); setShowAddModal(true); }}>
          <Plus className="h-4 w-4" /> Add Stock
        </Button>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {(['inventory', 'movements'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab
                ? 'bg-primary/10 text-primary dark:text-orange-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {tab === 'inventory' ? 'Inventory' : 'Movement Logs'}
          </button>
        ))}
      </div>

      {activeTab === 'inventory' && (
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by product or location..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
              <Button
                variant={lowStockOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setLowStockOnly(!lowStockOnly); setPage(1); }}
                className="dark:border-gray-600"
              >
                <AlertTriangle className="h-4 w-4" /> Low Stock
              </Button>
            </div>
            {stockLoading ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-600 dark:text-gray-400">
                      <th className="pb-3 font-medium">Product</th>
                      <th className="pb-3 font-medium">Quantity</th>
                      <th className="pb-3 font-medium">Reserved</th>
                      <th className="pb-3 font-medium">Available</th>
                      <th className="pb-3 font-medium">Location</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStock.map((item) => {
                      const isLow = item.available <= item.lowStockThreshold;
                      return (
                        <tr key={item._id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                          <td className="py-3 font-medium text-black dark:text-white">{item.productName}</td>
                          <td className="py-3 text-gray-700 dark:text-gray-300">{item.quantity}</td>
                          <td className="py-3 text-gray-600 dark:text-gray-400">{item.reserved}</td>
                          <td className="py-3 font-medium text-black dark:text-white">{item.available}</td>
                          <td className="py-3 text-gray-600 dark:text-gray-400">{item.location || 'N/A'}</td>
                          <td className="py-3">
                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${isLow ? 'bg-red-100 dark:bg-red-900 dark:text-red-300 text-red-700' : 'bg-green-100 dark:bg-green-900 dark:text-green-300 text-green-700'}`}>
                              {isLow ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <Button variant="ghost" size="icon" onClick={() => openEditModal(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredStock.length === 0 && (
                      <tr><td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">No stock items found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'movements' && (
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader><CardTitle className="text-black dark:text-white">Stock Movements</CardTitle></CardHeader>
          <CardContent>
            {movementLoading ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-600 dark:text-gray-400">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Product</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Quantity</th>
                      <th className="pb-3 font-medium">Reference</th>
                      <th className="pb-3 font-medium">Notes</th>
                      <th className="pb-3 font-medium">By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m._id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <td className="py-3 text-gray-600 dark:text-gray-400">{new Date(m.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="py-3 font-medium text-black dark:text-white">{m.productName}</td>
                        <td className="py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${typeColors[m.type] || ''}`}>{m.type}</span></td>
                        <td className="py-3 text-gray-700 dark:text-gray-300">{m.quantity}</td>
                        <td className="py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{m.reference || '-'}</td>
                        <td className="py-3 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{m.notes || '-'}</td>
                        <td className="py-3 text-gray-600 dark:text-gray-400">{m.performedBy || 'System'}</td>
                      </tr>
                    ))}
                    {movements.length === 0 && (
                      <tr><td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">No movements recorded</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showAddModal && (
        <StockModal
          title="Add Stock"
          formData={formData}
          setFormData={setFormData}
          editingItem={null}
          onSave={handleAddStock}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {showEditModal && (
        <StockModal
          title="Edit Stock"
          formData={formData}
          setFormData={setFormData}
          editingItem={editingItem}
          onSave={handleEditStock}
          onClose={() => { setShowEditModal(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
}
