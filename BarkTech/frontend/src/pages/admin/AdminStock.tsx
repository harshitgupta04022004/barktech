import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, AlertTriangle, X, Package, CircleDot, Minus } from 'lucide-react';

interface StockProduct { _id: string; name: string; slug: string; media?: { url: string }[]; }
interface StockItem { _id: string; productId: StockProduct | string; quantity: number; unit: string; minStock: number; maxStock: number; location?: string; notes?: string; createdAt: string; updatedAt: string; }
interface StockLog { _id: string; stockId: string; action: 'add' | 'remove' | 'adjust' | 'reserve' | 'release'; quantityChange: number; reason?: string; performedBy?: string; createdAt: string; }
interface FormData { productId: string; quantity: string; minStock: string; maxStock: string; location: string; notes: string; }
interface AdjustFormData { quantity: string; reason: string; }

const actionColors: Record<string, string> = { add: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', remove: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', adjust: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', reserve: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', release: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' };

function getProductName(stock: StockItem): string { return (typeof stock.productId === 'object' && stock.productId?.name) ? stock.productId.name : 'Unknown Product'; }
function getProductId(stock: StockItem): string { return typeof stock.productId === 'object' ? stock.productId._id : stock.productId; }

function StockModal({ title, formData, setFormData, onSave, onClose }: { title: string; formData: FormData; setFormData: React.Dispatch<React.SetStateAction<FormData>>; onSave: () => void; onClose: () => void; }) {
  const u = (f: keyof FormData, v: string) => setFormData((p) => ({ ...p, [f]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-card border border-border p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground/80"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-foreground">Product ID</label><Input value={formData.productId} onChange={(e) => u('productId', e.target.value)} placeholder="MongoDB Product ID" className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-foreground">Quantity</label><Input type="number" value={formData.quantity} onChange={(e) => u('quantity', e.target.value)} className="mt-1" /></div>
            <div><label className="text-sm font-medium text-foreground">Min Stock</label><Input type="number" value={formData.minStock} onChange={(e) => u('minStock', e.target.value)} className="mt-1" /></div>
          </div>
          <div><label className="text-sm font-medium text-foreground">Location</label><Input value={formData.location} onChange={(e) => u('location', e.target.value)} placeholder="Warehouse / shelf" className="mt-1" /></div>
          <div><label className="text-sm font-medium text-foreground">Notes</label><Input value={formData.notes} onChange={(e) => u('notes', e.target.value)} placeholder="Notes" className="mt-1" /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}

function AdjustModal({ title, formData, setFormData, onSave, onClose }: { title: string; formData: AdjustFormData; setFormData: React.Dispatch<React.SetStateAction<AdjustFormData>>; onSave: () => void; onClose: () => void; }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-card border border-border p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground/80"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-foreground">Quantity</label><Input type="number" value={formData.quantity} onChange={(e) => setFormData((p) => ({ ...p, quantity: e.target.value }))} className="mt-1" /></div>
          <div><label className="text-sm font-medium text-foreground">Reason</label><Input value={formData.reason} onChange={(e) => setFormData((p) => ({ ...p, reason: e.target.value }))} placeholder="Reason" className="mt-1" /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave}>Confirm</Button>
        </div>
      </div>
    </div>
  );
}

export function AdminStock() {
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'logs'>('inventory');
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({ productId: '', quantity: '0', minStock: '5', maxStock: '1000', location: '', notes: '' });
  const [adjustForm, setAdjustForm] = useState<AdjustFormData>({ quantity: '', reason: '' });

  const authH = (): Record<string, string> => { const t = localStorage.getItem('bark_auth_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

  const { data: stockData, isLoading: stockLoading, refetch } = useQuery<{ success: boolean; data: StockItem[]; meta: { total: number } }>({
    queryKey: ['admin-stock', page, lowStockOnly],
    queryFn: async () => { const params = new URLSearchParams({ page: String(page), limit: '20' }); if (lowStockOnly) params.set('lowStockOnly', 'true'); const res = await fetch(`/api/stock?${params}`, { headers: authH() }); if (!res.ok) return { success: false, data: [], meta: { total: 0 } }; return res.json(); },
  });
  const { data: lowStockData } = useQuery<{ success: boolean; data: StockItem[] }>({
    queryKey: ['admin-stock-low'],
    queryFn: async () => { const res = await fetch('/api/stock/low-stock', { headers: authH() }); if (!res.ok) return { success: false, data: [] }; return res.json(); },
  });
  const { data: logData, isLoading: logLoading } = useQuery<{ success: boolean; data: StockLog[] }>({
    queryKey: ['admin-stock-logs', selectedProductId],
    queryFn: async () => { if (!selectedProductId) return { success: false, data: [] }; const res = await fetch(`/api/stock/${selectedProductId}/logs`, { headers: authH() }); if (!res.ok) return { success: false, data: [] }; return res.json(); },
    enabled: activeTab === 'logs' && !!selectedProductId,
  });

  const stockItems = stockData?.data ?? [];
  const filteredStock = search ? stockItems.filter((s) => getProductName(s).toLowerCase().includes(search.toLowerCase()) || (s.location || '').toLowerCase().includes(search.toLowerCase())) : stockItems;
  const lowStockItems = lowStockData?.data ?? [];
  const logs = logData?.data ?? [];
  const filteredLogs = actionFilter === 'all' ? logs : logs.filter((l) => l.action === actionFilter);
  const outOfStockCount = stockItems.filter((s) => s.quantity <= 0).length;
  const lowStockCount = stockItems.filter((s) => s.quantity > 0 && s.quantity <= s.minStock).length;

  const resetForm = () => setFormData({ productId: '', quantity: '0', minStock: '5', maxStock: '1000', location: '', notes: '' });
  const handleAddStock = async () => { const t = localStorage.getItem('bark_auth_token'); const res = await fetch('/api/stock', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ productId: formData.productId, quantity: Number(formData.quantity), minStock: Number(formData.minStock), maxStock: Number(formData.maxStock || '1000'), location: formData.location, notes: formData.notes }) }); if (res.ok) { setShowAddModal(false); resetForm(); refetch(); } };
  const handleEditStock = async () => { if (!editingItem) return; const t = localStorage.getItem('bark_auth_token'); const pid = getProductId(editingItem); const res = await fetch(`/api/stock/${pid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ quantity: Number(formData.quantity), minStock: Number(formData.minStock), maxStock: Number(formData.maxStock), location: formData.location, notes: formData.notes }) }); if (res.ok) { setShowEditModal(false); setEditingItem(null); refetch(); } };
  const handleAdjustStock = async () => { if (!selectedProductId || !adjustForm.quantity) return; const t = localStorage.getItem('bark_auth_token'); const endpoint = adjustType === 'add' ? 'add' : 'deduct'; const res = await fetch(`/api/stock/${selectedProductId}/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ quantity: Number(adjustForm.quantity), reason: adjustForm.reason }) }); if (res.ok) { setShowAdjustModal(false); setAdjustForm({ quantity: '', reason: '' }); refetch(); } };
  const openEditModal = (item: StockItem) => { setEditingItem(item); setFormData({ productId: getProductId(item), quantity: String(item.quantity), minStock: String(item.minStock), maxStock: String(item.maxStock), location: item.location || '', notes: item.notes || '' }); setShowEditModal(true); };
  const openAdjust = (type: 'add' | 'deduct', pid: string) => { setAdjustType(type); setSelectedProductId(pid); setAdjustForm({ quantity: '', reason: '' }); setShowAdjustModal(true); };

  const statsCards = [
    { title: 'Total Items', value: stockData?.meta?.total ?? stockItems.length, icon: Package, iconBg: 'bg-blue-50 dark:bg-blue-950', iconColor: 'text-blue-500', border: '' },
    { title: 'Low Stock', value: lowStockCount, icon: AlertTriangle, iconBg: 'bg-yellow-50 dark:bg-yellow-950', iconColor: 'text-yellow-500', border: lowStockCount > 0 ? 'border-l-4 border-l-yellow-500' : '' },
    { title: 'Out of Stock', value: outOfStockCount, icon: CircleDot, iconBg: 'bg-red-50 dark:bg-red-950', iconColor: 'text-red-500', border: outOfStockCount > 0 ? 'border-l-4 border-l-red-500' : '' },
    { title: 'Low Stock Alerts', value: lowStockItems.length, icon: AlertTriangle, iconBg: 'bg-orange-50 dark:bg-orange-950', iconColor: 'text-orange-500', border: '' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Stock Management</h2>
        <Button onClick={() => { resetForm(); setShowAddModal(true); }}><Plus className="h-4 w-4" /> Add Stock</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title} className={stat.border}>
            <CardContent className="p-4"><div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.iconBg}`}><stat.icon className={`h-5 w-5 ${stat.iconColor}`} /></div>
              <div><p className="text-xs text-muted-foreground">{stat.title}</p><p className="text-xl font-bold text-foreground">{stat.value}</p></div>
            </div></CardContent>
          </Card>
        ))}
      </div>
      {outOfStockCount > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm font-medium text-red-700 dark:text-red-300 flex-1">{outOfStockCount} item(s) are out of stock and need immediate reorder</p>
        </div>
      )}
      <div className="flex gap-2 border-b border-border pb-2">
        {(['inventory', 'logs'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-primary/10 text-primary dark:text-orange-400' : 'text-muted-foreground hover:bg-muted'}`}>
            {tab === 'inventory' ? 'Inventory' : 'Stock Logs'}
          </button>
        ))}
      </div>
      {activeTab === 'inventory' && (
        <Card><CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search by product or location..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" /></div>
            <Button variant={lowStockOnly ? 'default' : 'outline'} size="sm" onClick={() => { setLowStockOnly(!lowStockOnly); setPage(1); }}><AlertTriangle className="h-4 w-4" /> Low Stock</Button>
          </div>
          {stockLoading ? <div className="py-8 text-center text-muted-foreground">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Product</th><th className="pb-3 font-medium text-right">Qty</th><th className="pb-3 font-medium text-right">Min</th><th className="pb-3 font-medium text-right">Max</th><th className="pb-3 font-medium">Location</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium text-right">Actions</th>
                </tr></thead>
                <tbody>
                  {filteredStock.map((item) => {
                    const isOOS = item.quantity <= 0; const isLow = item.quantity > 0 && item.quantity <= item.minStock; const pid = getProductId(item);
                    return (
                      <tr key={item._id} className={`border-b border-border last:border-0 ${isOOS ? 'bg-red-50/50 dark:bg-red-950/20' : isLow ? 'bg-yellow-50/50 dark:bg-yellow-950/20' : ''}`}>
                        <td className="py-3 font-medium text-foreground">{getProductName(item)}</td>
                        <td className="py-3 text-right font-mono font-bold"><span className={isOOS ? 'text-red-600 dark:text-red-400' : isLow ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}>{item.quantity}</span></td>
                        <td className="py-3 text-right font-mono text-muted-foreground">{item.minStock}</td>
                        <td className="py-3 text-right font-mono text-muted-foreground">{item.maxStock}</td>
                        <td className="py-3 text-muted-foreground">{item.location || '—'}</td>
                        <td className="py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${isOOS ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : isLow ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isOOS ? 'bg-red-500' : isLow ? 'bg-yellow-500' : 'bg-green-500'}`} />{isOOS ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span></td>
                        <td className="py-3 text-right"><div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedProductId(pid); setActiveTab('logs'); }} title="View Logs"><CircleDot className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openAdjust('add', pid)} title="Add"><Plus className="h-4 w-4 text-green-500" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openAdjust('deduct', pid)} title="Deduct"><Minus className="h-4 w-4 text-red-500" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(item)} title="Edit"><Edit className="h-4 w-4" /></Button>
                        </div></td>
                      </tr>
                    );
                  })}
                  {filteredStock.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No stock items found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </CardContent></Card>
      )}
      {activeTab === 'logs' && (
        <Card>
          <CardHeader><CardTitle className="text-foreground">Stock Movement Logs</CardTitle></CardHeader>
          <CardContent>
            {!selectedProductId ? (
              <p className="text-sm text-muted-foreground py-4">Select a product from the Inventory tab to view its stock logs.</p>
            ) : (
              <>
                <div className="flex gap-2 mb-4 flex-wrap">
                  {['all', 'add', 'remove', 'adjust', 'reserve', 'release'].map((a) => (
                    <Button key={a} variant={actionFilter === a ? 'default' : 'outline'} size="sm" onClick={() => setActionFilter(a)}>
                      {a === 'all' ? 'All' : a.charAt(0).toUpperCase() + a.slice(1)}
                    </Button>
                  ))}
                </div>
                {logLoading ? <div className="py-8 text-center text-muted-foreground">Loading...</div> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border text-left text-muted-foreground">
                        <th className="pb-3 font-medium">Date</th><th className="pb-3 font-medium">Action</th><th className="pb-3 font-medium text-right">Qty</th><th className="pb-3 font-medium">Reason</th><th className="pb-3 font-medium">By</th>
                      </tr></thead>
                      <tbody>
                        {filteredLogs.map((log) => (
                          <tr key={log._id} className="border-b border-border last:border-0">
                            <td className="py-3 text-muted-foreground">{new Date(log.createdAt).toLocaleDateString('en-IN')}</td>
                            <td className="py-3"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${actionColors[log.action] || ''}`}>{log.action}</span></td>
                            <td className="py-3 text-right font-mono"><span className={log.action === 'add' || log.action === 'release' ? 'text-green-600 dark:text-green-400' : log.action === 'remove' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}>{log.action === 'add' || log.action === 'release' ? '+' : log.action === 'remove' ? '-' : '±'}{log.quantityChange}</span></td>
                            <td className="py-3 text-xs text-muted-foreground max-w-[200px] truncate">{log.reason || '—'}</td>
                            <td className="py-3 text-xs text-muted-foreground">{log.performedBy || 'System'}</td>
                          </tr>
                        ))}
                        {filteredLogs.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No logs recorded</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
      {showAddModal && <StockModal title="Add Stock" formData={formData} setFormData={setFormData} onSave={handleAddStock} onClose={() => setShowAddModal(false)} />}
      {showEditModal && <StockModal title="Edit Stock" formData={formData} setFormData={setFormData} onSave={handleEditStock} onClose={() => { setShowEditModal(false); setEditingItem(null); }} />}
      {showAdjustModal && <AdjustModal title={adjustType === 'add' ? 'Add Stock' : 'Deduct Stock'} formData={adjustForm} setFormData={setAdjustForm} onSave={handleAdjustStock} onClose={() => setShowAdjustModal(false)} />}
    </div>
  );
}
