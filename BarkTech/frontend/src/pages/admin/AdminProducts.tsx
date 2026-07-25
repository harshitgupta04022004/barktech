import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus, Search, Edit, Trash2, X, Package, Star,
  ChevronDown, ChevronUp, Tag, Upload,
  FileText, Video, Sparkles, Loader2, Check, AlertCircle,
} from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  slug: string;
  models?: string;
  categoryId?: { name: string; _id: string };
  isActive: boolean;
  published: boolean;
  isFeatured: boolean;
  description?: string;
  shortDescription?: string;
  media?: { url: string; alt?: string }[];
  specs?: { key: string; value: string; unit?: string }[];
  leadTimeDays?: string;
  warrantyMonths?: number;
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface UploadedFile {
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'document';
  status: 'pending' | 'uploading' | 'done' | 'error';
  url?: string;
  error?: string;
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function AdminProducts() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);

  const { data, isLoading, refetch } = useQuery<{
    success: boolean; data: Product[]; meta: { total: number; totalPages: number };
  }>({
    queryKey: ['admin-products', page, search, categoryFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter === 'active' ? 'true' : 'false');
      const res = await fetch('/api/products?' + params.toString());
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
  const totalPages = data?.meta?.totalPages ?? 1;
  const categories = catData?.data ?? [];

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const token = localStorage.getItem('bark_auth_token');
    await fetch('/api/products/' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
    refetch();
  };

  const handleToggleStatus = async (product: Product) => {
    const token = localStorage.getItem('bark_auth_token');
    await fetch('/api/products/' + product._id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ published: !product.published }),
    });
    refetch();
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === products.length ? [] : products.map((p) => p._id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const openCreate = () => {
    setEditingItem(null);
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Products ({total})</h2>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">{selectedIds.length} selected</span>
          <Button size="sm" variant="outline" className="border-blue-300 dark:border-blue-700">
            <Tag className="h-3 w-3 mr-1" /> Assign Category
          </Button>
          <Button size="sm" variant="outline" className="border-blue-300 dark:border-blue-700" onClick={() => {
            selectedIds.forEach(async (id) => {
              const token = localStorage.getItem('bark_auth_token');
              const product = products.find((p) => p._id === id);
              if (product) {
                await fetch('/api/products/' + id, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                  body: JSON.stringify({ published: !product.published }),
                });
              }
            });
            setSelectedIds([]);
            refetch();
          }}>Toggle Status</Button>
          <Button size="sm" variant="outline" className="text-red-600 border-red-300 dark:border-red-700" onClick={async () => {
            if (!confirm('Delete ' + selectedIds.length + ' products?')) return;
            const token = localStorage.getItem('bark_auth_token');
            await Promise.all(selectedIds.map((id) => fetch('/api/products/' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })));
            setSelectedIds([]);
            refetch();
          }}>Delete</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Clear</Button>
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name, SKU, or model..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="h-10 rounded-md border border-input bg-white px-3 text-sm text-foreground">
              <option value="all">All Categories</option>
              {categories.map((cat) => (<option key={cat._id} value={cat._id}>{cat.name}</option>))}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="h-10 rounded-md border border-input bg-white px-3 text-sm text-foreground">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 font-medium w-10">
                      <input type="checkbox" className="rounded" checked={products.length > 0 && selectedIds.length === products.length} onChange={toggleSelectAll} />
                    </th>
                    <th className="pb-3 font-medium w-12"></th>
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">SKU / Model</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                    <th className="pb-3 font-medium text-center">Featured</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const isExpanded = expandedRow === product._id;
                    const statusClass = product.published
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300'
                      : 'bg-muted text-muted-foreground';
                    const dotClass = product.published ? 'bg-green-500' : 'bg-gray-400';
                    const statusText = product.published ? 'Active' : 'Inactive';

                    return [
                      <tr key={product._id} className="border-b border-border last:border-0 hover:bg-accent cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : product._id)}>
                        <td className="py-3" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" className="rounded" checked={selectedIds.includes(product._id)} onChange={() => toggleSelect(product._id)} />
                        </td>
                        <td className="py-3">
                          {product.media && product.media[0] && product.media[0].url ? (
                            <img src={product.media[0].url} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="font-medium text-foreground">{product.name}</div>
                          {product.shortDescription && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{product.shortDescription}</div>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                            {product.categoryId ? product.categoryId.name : 'Uncategorized'}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="font-mono text-xs text-muted-foreground">{product.models || '\u2014'}</span>
                        </td>
                        <td className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleToggleStatus(product)} className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors', statusClass)}>
                            <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', dotClass)} />
                            {statusText}
                          </button>
                        </td>
                        <td className="py-3 text-center">
                          {product.isFeatured ? (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mx-auto" />
                          ) : (
                            <Star className="h-4 w-4 text-gray-300 dark:text-gray-600 mx-auto" />
                          )}
                        </td>
                        <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedRow(isExpanded ? null : product._id)} title="Expand">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit"><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(product._id)} title="Delete"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
                        </td>
                      </tr>,
                      isExpanded && (
                        <tr key={product._id + '-expanded'}>
                          <td colSpan={8} className="p-4 bg-muted">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Description</h4>
                                <p className="text-sm text-foreground">{product.description || product.shortDescription || 'No description'}</p>
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Media</h4>
                                <div className="flex gap-2 flex-wrap">
                                  {product.media && product.media.slice(0, 4).map((m, i) => (
                                    <img key={i} src={m.url} alt={m.alt || product.name} className="h-16 w-16 rounded-lg object-cover" />
                                  ))}
                                  {(!product.media || product.media.length === 0) && <span className="text-xs text-muted-foreground">No images</span>}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Details</h4>
                                <div className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
                                  <div>Created: {new Date(product.createdAt).toLocaleDateString('en-IN')}</div>
                                  <div>Model: {product.models || '\u2014'}</div>
                                  {product.specs && product.specs.length > 0 && (
                                    <div className="mt-2">
                                      <span className="font-medium">Specs:</span>
                                      {product.specs.slice(0, 3).map((s, i) => (
                                        <div key={i} className="ml-2">{s.key}: {s.value}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ),
                    ];
                  })}
                  {products.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No products found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {total > 10 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 10 + 1}{'\u2013'}{Math.min(page * 10, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateModal && (
        <CreateProductModal
          onClose={() => { setShowCreateModal(false); setEditingItem(null); }}
          onCreated={() => { setShowCreateModal(false); setEditingItem(null); refetch(); }}
          categories={categories}
          editingItem={editingItem}
        />
      )}
    </div>
  );
}

function CreateProductModal({
  onClose,
  onCreated: _onCreated,
  categories,
  editingItem,
}: {
  onClose: () => void;
  onCreated: () => void;
  categories: Category[];
  editingItem: Product | null;
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<{ success: boolean; message: string; product?: Product } | null>(null);
  const [error, setError] = useState('');

  const [name, setName] = useState(editingItem?.name || '');
  const [shortDescription, setShortDescription] = useState(editingItem?.shortDescription || '');
  const [description, setDescription] = useState(editingItem?.description || '');
  const [categoryId, setCategoryId] = useState(editingItem?.categoryId?._id || '');
  const [categoryName, setCategoryName] = useState(editingItem?.categoryId?.name || '');
  const [models, setModels] = useState(editingItem?.models || '');
  const [leadTimeDays, setLeadTimeDays] = useState(editingItem?.leadTimeDays || '');
  const [warrantyMonths, setWarrantyMonths] = useState(editingItem?.warrantyMonths?.toString() || '');
  const [isFeatured, setIsFeatured] = useState(editingItem?.isFeatured || false);

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const getToken = () => localStorage.getItem('bark_auth_token');

  const createCategoryMut = useMutation({
    mutationFn: async (data: { name: string }) => {
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const res = await fetch('/api/products/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ name: data.name, slug }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setCategoryId(data.data._id);
        setCategoryName(data.data.name);
        setShowNewCategory(false);
        setNewCategoryName('');
        queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      }
    },
  });

  const handleFiles = useCallback((files: FileList | File[]) => {
    const newFiles: UploadedFile[] = [];
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isDocument = file.type === 'application/pdf' || file.type.startsWith('text/');

      if (!isImage && !isVideo && !isDocument) return;

      const uploaded: UploadedFile = {
        file,
        type: isImage ? 'image' : isVideo ? 'video' : 'document',
        status: 'pending',
      };

      if (isImage) {
        uploaded.preview = URL.createObjectURL(file);
      }

      newFiles.push(uploaded);
    });

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const updated = [...prev];
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  // Extracted data from AI processing
  const [extractedData, setExtractedData] = useState<Record<string, unknown> | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [, setCreatedProductId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Product name is required');
      return;
    }

    setIsProcessing(true);
    setStep(3);
    setExtractionStatus('processing');
    setError('');
    setExtractedData(null);

    try {
      const mediaUrls: { url: string; alt?: string }[] = [];

      for (const uploaded of uploadedFiles) {
        if (uploaded.type === 'image' && uploaded.preview) {
          mediaUrls.push({ url: uploaded.preview, alt: uploaded.file.name });
        }
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('shortDescription', shortDescription);
      formData.append('description', description);
      formData.append('categoryId', categoryId);
      formData.append('categoryName', categoryName);
      formData.append('models', models);
      formData.append('leadTimeDays', leadTimeDays);
      formData.append('warrantyMonths', warrantyMonths);
      formData.append('isFeatured', String(isFeatured));
      formData.append('media', JSON.stringify(mediaUrls));

      for (const uploaded of uploadedFiles) {
        formData.append('files', uploaded.file);
      }

      const token = getToken();
      const res = await fetch('/api/products/create-with-ai', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: formData,
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to create product');
      }

      const productId = result.data?._id;
      setCreatedProductId(productId);

      setAiResult({
        success: true,
        message: result.message || 'Product created. Processing files...',
        product: result.data,
      });

      // Now extract info from PDF/DOCX files
      const docFiles = uploadedFiles.filter(
        (f) => f.file.type === 'application/pdf' || f.file.type.includes('document') || f.file.name.endsWith('.docx')
      );

      if (docFiles.length > 0 && productId) {
        let allExtracted: Record<string, unknown> = {};

        for (const docFile of docFiles) {
          try {
            const extractFormData = new FormData();
            extractFormData.append('product_id', productId);
            extractFormData.append('file', docFile.file);

            const agentUrl = import.meta.env.VITE_AGENT_URL || 'http://localhost:8000';
            const extractRes = await fetch(`${agentUrl}/agent/extract-from-upload`, {
              method: 'POST',
              body: extractFormData,
            });

            const extractResult = await extractRes.json();

            if (extractResult.success && extractResult.extracted) {
              allExtracted = { ...allExtracted, ...extractResult.extracted };
            }
          } catch (extractErr) {
            console.warn('File extraction failed for', docFile.file.name, extractErr);
          }
        }

        if (Object.keys(allExtracted).length > 0) {
          setExtractedData(allExtracted);
          setExtractionStatus('done');
        } else {
          setExtractionStatus('error');
        }
      } else {
        setExtractionStatus('done');
      }

      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
      setError(errorMessage);
      setStep(2);
      setExtractionStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply extracted data to form fields and go back to step 1
  const applyExtractedData = () => {
    if (!extractedData) return;
    if (extractedData.name) setName(extractedData.name as string);
    if (extractedData.shortDescription) setShortDescription(extractedData.shortDescription as string);
    if (extractedData.description) setDescription(extractedData.description as string);
    if (extractedData.models) setModels(extractedData.models as string);
    if (extractedData.leadTimeDays) setLeadTimeDays(extractedData.leadTimeDays as string);
    if (extractedData.warrantyMonths) setWarrantyMonths(String(extractedData.warrantyMonths));
    setStep(1);
    setExtractedData(null);
    setExtractionStatus('idle');
  };

  const stepClass = (s: number) => cn(
    'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors',
    step >= s ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground'
  );

  const labelClass = (s: number) => cn(
    'text-xs font-medium',
    step >= s ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'
  );

  const lineClass = (s: number) => cn(
    'w-8 h-0.5',
    step > s ? 'bg-orange-500' : 'bg-muted'
  );

  const dropZoneClass = cn(
    'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
    isDragOver
      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
      : 'border-input hover:border-orange-400 hover:bg-accent'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-xl bg-card border border-border shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-foreground">
              {editingItem ? 'Edit Product' : 'Add New Product'}
            </h3>
              {step === 3 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium">
                <Sparkles className="h-3 w-3" />
                AI Processing
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-4 py-3 bg-muted border-b border-border">
          <div className="flex items-center gap-2">
            {[
              { num: 1, label: 'Details' },
              { num: 2, label: 'Files' },
              { num: 3, label: 'AI Processing' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={stepClass(s.num)}>
                  {step > s.num ? <Check className="h-3.5 w-3.5" /> : s.num}
                </div>
                <span className={labelClass(s.num)}>{s.label}</span>
                {i < 2 && <div className={lineClass(s.num)} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Product Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Semi Automatic Stitching Machine" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Short Description</label>
                <Input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Brief one-liner about the product" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Full Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed product description, features, applications..."
                  className="mt-1 flex min-h-[120px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Model / SKU</label>
                  <Input value={models} onChange={(e) => setModels(e.target.value)} placeholder="e.g., TYS-1600" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <div className="flex gap-2 mt-1">
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        const cat = categories.find((c) => c._id === e.target.value);
                        setCategoryName(cat ? cat.name : '');
                      }}
                      className="flex-1 h-10 rounded-md border border-input bg-white px-3 text-sm text-foreground"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowNewCategory(!showNewCategory)} className="shrink-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  {showNewCategory && (
                    <div className="mt-2 flex gap-2">
                      <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category name" className="flex-1" />
                      <Button
                        type="button"
                        size="sm"
                        disabled={!newCategoryName.trim() || creatingCategory}
                        onClick={async () => {
                          setCreatingCategory(true);
                          await createCategoryMut.mutateAsync({ name: newCategoryName });
                          setCreatingCategory(false);
                        }}
                      >
                        {creatingCategory ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Create'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Lead Time (days)</label>
                  <Input value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)} placeholder="e.g., 7-14" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Warranty (months)</label>
                  <Input value={warrantyMonths} onChange={(e) => setWarrantyMonths(e.target.value)} placeholder="e.g., 12" type="number" className="mt-1" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="featured" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="rounded" />
                <label htmlFor="featured" className="text-sm font-medium text-foreground">Featured Product</label>
              </div>
            </div>
          )}

          {/* Step 2: File Upload */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                Upload product images, videos, or documents. AI will analyze them to generate professional product details.
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className={dropZoneClass}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.txt,.csv,.md"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Drag & drop files here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Images (JPEG, PNG, WebP), Videos (MP4, WebM), Documents (PDF, TXT)
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase">Uploaded Files ({uploadedFiles.length})</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {uploadedFiles.map((uf, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted">
                        {uf.preview ? (
                          <img src={uf.preview} alt={uf.file.name} className="h-12 w-12 rounded-lg object-cover" />
                        ) : uf.type === 'video' ? (
                          <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Video className="h-5 w-5 text-purple-500" />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{uf.file.name}</p>
                          <p className="text-xs text-gray-500">{(uf.file.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="text-muted-foreground hover:text-red-500">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">AI Enhancement</h4>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-0.5">
                  <li>- Upload product photos for AI to analyze features</li>
                  <li>- Upload datasheets/PDFs for AI to extract technical specs</li>
                  <li>- Processing takes just a few seconds</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: AI Processing + Extraction Review */}
          {step === 3 && (
            <div className="py-6">
              {extractionStatus === 'processing' ? (
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 mx-auto text-orange-500 animate-spin" />
                  <h4 className="text-lg font-bold text-foreground">Processing Product</h4>
                  <p className="text-sm text-muted-foreground">
                    {aiResult?.success ? 'Analyzing uploaded files...' : 'Creating product...'}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Sparkles className="h-3 w-3 text-orange-500" />
                    Just a few seconds
                  </div>
                </div>
              ) : extractedData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-orange-500" />
                    <h4 className="text-base font-bold text-foreground">AI Extracted Details</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    The AI analyzed your uploaded files and extracted the following details. Review and accept, or edit manually.
                  </p>
                  <div className="space-y-3 text-sm">
                    {typeof extractedData.name === 'string' && extractedData.name && (
                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase">Name</span>
                        <p className="text-foreground">{extractedData.name}</p>
                      </div>
                    )}
                    {typeof extractedData.shortDescription === 'string' && extractedData.shortDescription && (
                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase">Short Description</span>
                        <p className="text-foreground">{extractedData.shortDescription}</p>
                      </div>
                    )}
                    {typeof extractedData.description === 'string' && extractedData.description && (
                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase">Description</span>
                        <p className="text-foreground text-xs max-h-24 overflow-y-auto">{extractedData.description}</p>
                      </div>
                    )}
                    {typeof extractedData.models === 'string' && extractedData.models && (
                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase">Models</span>
                        <p className="text-foreground">{extractedData.models}</p>
                      </div>
                    )}
                    {Array.isArray(extractedData.specs) && (extractedData.specs as unknown[]).length > 0 && (
                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase">Specifications</span>
                        <div className="mt-1 space-y-1">
                          {(extractedData.specs as Array<{key: string; value: string; unit?: string}>).map((spec, i) => (
                            <div key={i} className="flex gap-2 text-xs">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{spec.key}:</span>
                              <span className="text-muted-foreground">{spec.value}{spec.unit ? ` ${spec.unit}` : ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {typeof extractedData.categoryGuess === 'string' && extractedData.categoryGuess && (
                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase">Category Guess</span>
                        <p className="text-foreground">{extractedData.categoryGuess}</p>
                      </div>
                    )}
                    {typeof extractedData.confidence === 'number' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Confidence</span>
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          (extractedData.confidence as number) >= 0.7
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        )}>
                          {((extractedData.confidence as number) * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={applyExtractedData} className="flex-1">
                      <Check className="h-4 w-4 mr-1" /> Accept & Edit
                    </Button>
                    <Button variant="outline" onClick={() => { setExtractionStatus('idle'); setExtractedData(null); }} className="flex-1">
                      Skip
                    </Button>
                  </div>
                </div>
              ) : aiResult && aiResult.success ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="text-lg font-bold text-green-700 dark:text-green-300">Product Created Successfully!</h4>
                  <p className="text-sm text-muted-foreground">{aiResult.message}</p>
                  <p className="text-xs text-gray-500">Closing automatically...</p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 mx-auto text-orange-500 animate-spin" />
                  <h4 className="text-lg font-bold text-foreground">Processing...</h4>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <div className="flex gap-2">
            {step > 1 && step < 3 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
            )}
            {step === 1 && (
              <Button onClick={() => { setError(''); setStep(2); }}>Next: Add Files</Button>
            )}
            {step === 2 && (
              <Button onClick={handleSubmit} disabled={isProcessing || !name.trim()}>
                {isProcessing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Create & AI Enhance</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
