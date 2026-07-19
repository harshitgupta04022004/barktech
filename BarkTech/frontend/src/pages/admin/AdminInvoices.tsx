import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Plus, X, Download, FileText, Eye, Trash2, Wand2,
  ChevronDown, ChevronUp, Send, CheckCircle,
  Building2, MapPin, Hash, Truck,
} from 'lucide-react';

interface InvoiceItem {
  description: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerCompany?: string;
  customerAddress?: string;
  customerGst?: string;
  customerPhone?: string;
  customerEmail?: string;
  shipToAddress?: string;
  modeOfDelivery?: string;
  dispatchFrom?: string;
  refAttendedBy?: string;
  items: InvoiceItem[];
  subtotal: number;
  gstAmount: number;
  gstRate: number;
  total: number;
  amountInWords?: string;
  status: string;
  currency: string;
  createdAt: string;
}

interface DraftItem {
  description: string;
  hsnCode: string;
  quantity: string;
  unitPrice: string;
  gstRate: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  partially_paid: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

const defaultDraft = {
  customerName: '',
  customerCompany: '',
  customerAddress: '',
  customerGst: '',
  customerPhone: '',
  customerEmail: '',
  shipToAddress: '',
  modeOfDelivery: 'BY TRANSPORT',
  dispatchFrom: '',
  refAttendedBy: '',
  items: [{ description: '', hsnCode: '', quantity: '1', unitPrice: '0', gstRate: '18' }],
  notes: '',
};

export function AdminInvoices() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showPreview, setShowPreview] = useState<Invoice | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [draft, setDraft] = useState(defaultDraft);
  const [formattingField, setFormattingField] = useState<string | null>(null);

  // Fetch invoices
  const { data, isLoading, refetch } = useQuery<{
    success: boolean;
    data: Invoice[];
    meta: { total: number };
  }>({
    queryKey: ['admin-invoices'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/invoices?limit=50', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return { success: false, data: [], meta: { total: 0 } };
      return res.json();
    },
  });

  // Next invoice number
  const { data: nextNumData } = useQuery({
    queryKey: ['invoice-next-number'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/invoices/next-number', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return { data: { nextNumber: 'BARK26-27S001' } };
      return res.json();
    },
    enabled: showCreate,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create invoice');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-next-number'] });
      setShowCreate(false);
      setDraft(defaultDraft);
    },
  });

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/invoices/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
    },
  });

  const invoices = data?.data ?? [];
  const filtered = search
    ? invoices.filter(
        (inv) =>
          inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
          inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
          (inv.customerCompany || '').toLowerCase().includes(search.toLowerCase())
      )
    : invoices;
  const total = data?.meta?.total ?? 0;
  const nextNumber = nextNumData?.data?.nextNumber || 'BARK26-27S001';

  // Item management
  const addItem = () =>
    setDraft({
      ...draft,
      items: [...draft.items, { description: '', hsnCode: '', quantity: '1', unitPrice: '0', gstRate: '18' }],
    });

  const removeItem = (i: number) => {
    if (draft.items.length <= 1) return;
    setDraft({ ...draft, items: draft.items.filter((_, idx) => idx !== i) });
  };

  const updateItem = (i: number, field: keyof DraftItem, value: string) => {
    const newItems = [...draft.items];
    newItems[i] = { ...newItems[i], [field]: value };
    setDraft({ ...draft, items: newItems });
  };

  // Calculations
  const subtotal = draft.items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  );
  const gstAmount = draft.items.reduce(
    (sum, it) =>
      sum + ((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0) * (Number(it.gstRate) || 0)) / 100,
    0
  );
  const grandTotal = subtotal + gstAmount;

  // AI Text formatting
  const formatText = async (text: string, context: string): Promise<string> => {
    try {
      const res = await fetch('/agent/invoice/format-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.formatted || text;
      }
    } catch (e) {
      console.warn('Format text failed, using raw text');
    }
    return text;
  };

  const handleFormatField = async (field: string, value: string, context: string) => {
    setFormattingField(field);
    const formatted = await formatText(value, context);
    if (field === 'customerAddress') {
      setDraft({ ...draft, customerAddress: formatted });
    } else if (field === 'shipToAddress') {
      setDraft({ ...draft, shipToAddress: formatted });
    } else if (field === 'customerName') {
      setDraft({ ...draft, customerName: formatted });
    } else if (field === 'customerCompany') {
      setDraft({ ...draft, customerCompany: formatted });
    }
    setFormattingField(null);
  };

  // Format item description via AI
  const handleFormatItemDescription = async (i: number) => {
    const desc = draft.items[i].description;
    if (!desc.trim()) return;
    setFormattingField(`item-desc-${i}`);
    const formatted = await formatText(desc, 'description');
    updateItem(i, 'description', formatted);
    setFormattingField(null);
  };

  // Submit create
  const handleCreate = () => {
    const payload = {
      customerName: draft.customerName,
      customerCompany: draft.customerCompany,
      customerAddress: draft.customerAddress,
      customerGst: draft.customerGst,
      customerPhone: draft.customerPhone,
      customerEmail: draft.customerEmail,
      shipToAddress: draft.shipToAddress || draft.customerAddress,
      modeOfDelivery: draft.modeOfDelivery,
      dispatchFrom: draft.dispatchFrom,
      refAttendedBy: draft.refAttendedBy,
      items: draft.items
        .filter((it) => it.description)
        .map((it) => ({
          description: it.description,
          hsnCode: it.hsnCode,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          gstRate: Number(it.gstRate) || 18,
        })),
      notes: draft.notes,
    };
    createMutation.mutate(payload);
  };

  // Download PDF
  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      const token = localStorage.getItem('token');
      // Build PDF data from invoice
      const pdfData = {
        invoice_number: invoice.invoiceNumber,
        customer_name: invoice.customerName,
        customer_company: invoice.customerCompany || '',
        customer_address: invoice.customerAddress || '',
        customer_gst: invoice.customerGst || '',
        customer_phone: invoice.customerPhone || '',
        ship_to_address: invoice.shipToAddress || '',
        mode_of_delivery: invoice.modeOfDelivery || 'BY TRANSPORT',
        dispatch_from: invoice.dispatchFrom || '',
        ref_attended_by: invoice.refAttendedBy || '',
        items: invoice.items.map((it) => ({
          description: it.description,
          hsn_code: it.hsnCode,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          gst_rate: it.gstRate,
        })),
        gst_rate: invoice.gstRate || 18,
        subtotal: invoice.subtotal,
        gst_amount: invoice.gstAmount,
        total: invoice.total,
      };

      // Try Python agent first for actual PDF
      const agentRes = await fetch('/agent/invoice/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfData),
      });

      if (agentRes.ok) {
        const blob = await agentRes.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        return;
      }
    } catch (e) {
      console.warn('PDF download via agent failed, using backend fallback');
    }

    // Fallback: use backend
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/invoices/${invoice._id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (e) {
      console.error('PDF download failed');
    }
  };

  // Download DOCX (HTML-based)
  const handleDownloadDocx = async (invoice: Invoice) => {
    try {
      const pdfData = {
        invoice_number: invoice.invoiceNumber,
        customer_name: invoice.customerName,
        customer_company: invoice.customerCompany || '',
        customer_address: invoice.customerAddress || '',
        customer_gst: invoice.customerGst || '',
        customer_phone: invoice.customerPhone || '',
        ship_to_address: invoice.shipToAddress || '',
        mode_of_delivery: invoice.modeOfDelivery || 'BY TRANSPORT',
        dispatch_from: invoice.dispatchFrom || '',
        ref_attended_by: invoice.refAttendedBy || '',
        items: invoice.items.map((it) => ({
          description: it.description,
          hsn_code: it.hsnCode,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          gst_rate: it.gstRate,
        })),
        gst_rate: invoice.gstRate || 18,
        subtotal: invoice.subtotal,
        gst_amount: invoice.gstAmount,
        total: invoice.total,
      };

      const res = await fetch('/agent/invoice/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfData),
      });

      if (res.ok) {
        const html = await res.text();
        const blob = new Blob([html], { type: 'application/msword' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoice.invoiceNumber}.doc`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (e) {
      console.error('DOCX download failed');
    }
  };

  // Preview invoice
  const handlePreview = async (invoice: Invoice) => {
    setShowPreview(invoice);
  };

  const renderPreview = useCallback(() => {
    if (!showPreview) return null;
    const inv = showPreview;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowPreview(null)}>
        <div
          className="w-full max-w-4xl max-h-[95vh] overflow-y-auto bg-white rounded-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Invoice Preview */}
          <div className="p-8 text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-orange-600 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <img src="/images/bark-logo.png" alt="Bark Technologies" className="h-10" />
                <div>
                  <div className="text-lg font-bold text-orange-600 tracking-wide">TAX INVOICE</div>
                </div>
              </div>
            </div>

            {/* Amount in words */}
            <div className="bg-gray-50 border-l-3 border-orange-600 px-3 py-2 text-xs font-bold uppercase mb-3">
              {inv.amountInWords || 'AMOUNT IN WORDS'}
            </div>

            {/* Invoice number */}
            <div className="text-right text-sm font-bold text-orange-600 mb-3">
              TAX INVOICE: {inv.invoiceNumber}
            </div>

            {/* Bill To & From */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="border border-gray-300 p-3">
                <h3 className="text-xs font-bold text-orange-600 uppercase border-b border-orange-600 pb-1 mb-2">Bill To</h3>
                <div className="text-sm font-bold">{inv.customerName}</div>
                {inv.customerCompany && <div className="text-xs">{inv.customerCompany}</div>}
                {inv.customerAddress && <div className="text-xs whitespace-pre-line">{inv.customerAddress}</div>}
                {inv.customerGst && <div className="text-xs"><strong>GSTIN:</strong> {inv.customerGst}</div>}
                {inv.customerPhone && <div className="text-xs"><strong>CONTACT NO.</strong> {inv.customerPhone}</div>}
                {inv.refAttendedBy && <div className="text-xs"><strong>REF BY & ATTEND BY:</strong> {inv.refAttendedBy}</div>}
              </div>
              <div className="border border-gray-300 p-3">
                <h3 className="text-xs font-bold text-orange-600 uppercase border-b border-orange-600 pb-1 mb-2">From</h3>
                <div className="text-sm font-bold">BARK TECHNOLOGIES</div>
                <div className="text-xs whitespace-pre-line">SF-03, LOCAL SHOPPING COMPLEX, SHUSHANT AQUAPOLIS, GHAZIABAD UTTAR PRADESH 201009</div>
                <div className="text-xs"><strong>GST:</strong> 09AAWFB1759R1ZC</div>
                <div className="text-xs"><strong>CONTACT NUMBER:</strong> 07042245270/8810597980</div>
                <div className="text-xs"><strong>EMAIL:</strong> sales1barktechnologies@gmail.com</div>
              </div>
            </div>

            {/* Ship To */}
            <div className="border border-gray-300 p-3 mb-3">
              <h3 className="text-xs font-bold text-orange-600 uppercase border-b border-orange-600 pb-1 mb-2">Ship To</h3>
              <div className="text-xs whitespace-pre-line">{inv.shipToAddress || inv.customerAddress || 'Same as Bill To'}</div>
            </div>

            {/* Details/Mode */}
            <div className="border border-gray-300 p-3 mb-3">
              <h3 className="text-xs font-bold text-orange-600 uppercase border-b border-orange-600 pb-1 mb-2">Details / Mode</h3>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div><strong>TAX INVOICE NUMBER:</strong> {inv.invoiceNumber}</div>
                <div><strong>DATE OF INVOICE:</strong> {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <div><strong>MODE OF DELIVERY:</strong> {inv.modeOfDelivery || 'BY TRANSPORT'}</div>
                <div><strong>DISPATCH FROM:</strong> {inv.dispatchFrom || '-'}</div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-xs border-collapse mb-3">
              <thead>
                <tr className="bg-orange-600 text-white">
                  <th className="p-2 text-left w-[5%]">S.NO</th>
                  <th className="p-2 text-left w-[35%]">DESCRIPTION</th>
                  <th className="p-2 text-right w-[12%]">HSN CODE</th>
                  <th className="p-2 text-right w-[14%]">RATE/PC</th>
                  <th className="p-2 text-right w-[8%]">QTY</th>
                  <th className="p-2 text-right w-[16%]">AMOUNT IN INR</th>
                </tr>
              </thead>
              <tbody>
                {inv.items.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2">{item.description}</td>
                    <td className="p-2 text-right">{item.hsnCode}</td>
                    <td className="p-2 text-right">{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-2 text-right">{item.quantity}</td>
                    <td className="p-2 text-right">{(item.quantity * item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-3">
              <table className="text-xs w-72">
                <tbody>
                  <tr><td className="py-1">TOTAL BEFORE TAX</td><td className="py-1 text-right font-bold">{inv.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td className="py-1">GST {inv.gstRate || 18}%</td><td className="py-1 text-right font-bold">{inv.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                  <tr className="border-t-2 border-orange-600">
                    <td className="py-1 text-sm font-bold text-orange-600">GRAND TOTAL</td>
                    <td className="py-1 text-right text-sm font-bold text-orange-600">{inv.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bank Details */}
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div className="border border-gray-300 p-3">
                <h3 className="font-bold text-orange-600 border-b border-orange-600 pb-1 mb-2">Bank Details</h3>
                <div><strong>Beneficiary Name:</strong> BARK TECHNOLOGIES</div>
                <div><strong>Bank:</strong> ICICI BANK LTD</div>
                <div><strong>Bank Address:</strong> NOIDA 132</div>
                <div><strong>A/c No:</strong> 157905003103</div>
                <div><strong>IFSC Code:</strong> ICIC0001579</div>
              </div>
              <div className="border border-gray-300 p-3">
                <h3 className="font-bold text-orange-600 border-b border-orange-600 pb-1 mb-2">For and on Behalf of BARK TECHNOLOGIES</h3>
                <div><strong>Address:</strong> SF-03, LOCAL SHOPPING COMPLEX, SHUSHANT AQUAPOLIS, GHAZIABAD UP 201009</div>
                <div><strong>GST:</strong> 09AAWFB1759R1ZC</div>
                <div><strong>Email:</strong> sales1barktechnologies@gmail.com</div>
                <div><strong>Contact No:</strong> 07042245270/8810597980</div>
              </div>
            </div>

            {/* Signature */}
            <div className="flex justify-between items-end mt-6 pt-3">
              <div className="text-xs text-gray-500">Thanks &amp; Regards</div>
              <div className="text-right">
                <div className="text-xs font-bold text-orange-600 mb-8">Authorized Signatory</div>
                <div className="border-t border-gray-400 w-40 text-xs text-gray-500 pt-1">Signature / Stamp</div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-gray-400 mt-4 border-t border-gray-200 pt-2">
              Note: This is computer generated tax invoice. If needed original copy please inform to send.
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setShowPreview(null)}>Close</Button>
            <Button onClick={() => handleDownloadPdf(inv)}>
              <Download className="h-4 w-4" /> Download PDF
            </Button>
            <Button variant="secondary" onClick={() => handleDownloadDocx(inv)}>
              <FileText className="h-4 w-4" /> Download DOC
            </Button>
          </div>
        </div>
      </div>
    );
  }, [showPreview]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">Invoices</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} total invoices</p>
        </div>
        <Button
          onClick={() => {
            setDraft(defaultDraft);
            setShowCreate(true);
          }}
        >
          <Plus className="h-4 w-4" /> New Invoice
        </Button>
      </div>

      {/* Invoice List */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-600 dark:text-gray-400">
                    <th className="pb-3 font-medium">Invoice #</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <>
                      <tr
                        key={inv._id}
                        className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === inv._id ? null : inv._id)}
                      >
                        <td className="py-3 font-mono text-sm text-black dark:text-white">{inv.invoiceNumber}</td>
                        <td className="py-3">
                          <div className="font-medium text-black dark:text-white">{inv.customerName}</div>
                          {inv.customerCompany && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{inv.customerCompany}</div>
                          )}
                        </td>
                        <td className="py-3 text-gray-700 dark:text-gray-300 font-medium">
                          {inv.total ? `₹${inv.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[inv.status] || ''}`}>
                            {inv.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 text-gray-600 dark:text-gray-400">
                          {new Date(inv.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handlePreview(inv)}
                              title="Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDownloadPdf(inv)}
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {expandedRow === inv._id ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedRow === inv._id && (
                        <tr key={`${inv._id}-expanded`}>
                          <td colSpan={6} className="p-4 bg-gray-50 dark:bg-gray-800/50">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div>
                                <span className="text-gray-500 dark:text-gray-400 block">Items</span>
                                {inv.items.map((item, i) => (
                                  <div key={i} className="text-black dark:text-white">
                                    {item.description} x{item.quantity}
                                  </div>
                                ))}
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400 block">Subtotal</span>
                                <span className="text-black dark:text-white font-medium">
                                  ₹{inv.subtotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400 block">GST</span>
                                <span className="text-black dark:text-white font-medium">
                                  ₹{inv.gstAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400 block">Mode</span>
                                <span className="text-black dark:text-white">{inv.modeOfDelivery || '—'}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                              {inv.status === 'draft' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => statusMutation.mutate({ id: inv._id, action: 'submit' })}
                                >
                                  <Send className="h-3 w-3 mr-1" /> Send
                                </Button>
                              )}
                              {inv.status === 'sent' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => statusMutation.mutate({ id: inv._id, action: 'mark-paid' })}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" /> Mark Paid
                                </Button>
                              )}
                              {inv.status !== 'cancelled' && inv.status !== 'paid' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => statusMutation.mutate({ id: inv._id, action: 'cancel' })}
                                >
                                  <X className="h-3 w-3 mr-1" /> Cancel
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        No invoices found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <div
            className="w-full max-w-3xl rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-black dark:text-white">New Invoice</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Invoice #: {nextNumber}</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Bill To Section */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-orange-600" />
                  <h4 className="text-sm font-bold text-orange-600 uppercase">Bill To</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Customer Name *</label>
                    <div className="flex gap-1 mt-1">
                      <Input
                        value={draft.customerName}
                        onChange={(e) => setDraft({ ...draft, customerName: e.target.value })}
                        placeholder="e.g. Skyline Printpack"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        onClick={() => handleFormatField('customerName', draft.customerName, 'general')}
                        disabled={formattingField === 'customerName'}
                        title="AI Format"
                      >
                        <Wand2 className={`h-4 w-4 ${formattingField === 'customerName' ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Company</label>
                    <div className="flex gap-1 mt-1">
                      <Input
                        value={draft.customerCompany}
                        onChange={(e) => setDraft({ ...draft, customerCompany: e.target.value })}
                        placeholder="Company name"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        onClick={() => handleFormatField('customerCompany', draft.customerCompany, 'general')}
                        disabled={formattingField === 'customerCompany'}
                        title="AI Format"
                      >
                        <Wand2 className={`h-4 w-4 ${formattingField === 'customerCompany' ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Address</label>
                    <div className="flex gap-1 mt-1">
                      <textarea
                        value={draft.customerAddress}
                        onChange={(e) => setDraft({ ...draft, customerAddress: e.target.value })}
                        className="flex min-h-[60px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-black dark:text-white"
                        placeholder="Full address with PIN code"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0 self-start"
                        onClick={() => handleFormatField('customerAddress', draft.customerAddress, 'address')}
                        disabled={formattingField === 'customerAddress'}
                        title="AI Format Address"
                      >
                        <Wand2 className={`h-4 w-4 ${formattingField === 'customerAddress' ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">GSTIN</label>
                    <Input
                      value={draft.customerGst}
                      onChange={(e) => setDraft({ ...draft, customerGst: e.target.value })}
                      placeholder="e.g. 24AFRFS3600L1ZQ"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Phone</label>
                    <Input
                      value={draft.customerPhone}
                      onChange={(e) => setDraft({ ...draft, customerPhone: e.target.value })}
                      placeholder="Contact number"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Ship To Section */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-orange-600" />
                  <h4 className="text-sm font-bold text-orange-600 uppercase">Ship To</h4>
                </div>
                <div className="flex gap-1">
                  <textarea
                    value={draft.shipToAddress}
                    onChange={(e) => setDraft({ ...draft, shipToAddress: e.target.value })}
                    className="flex min-h-[60px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-black dark:text-white"
                    placeholder="Shipping address (leave blank to use Bill To address)"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 self-start"
                    onClick={() => handleFormatField('shipToAddress', draft.shipToAddress, 'address')}
                    disabled={formattingField === 'shipToAddress'}
                    title="AI Format Address"
                  >
                    <Wand2 className={`h-4 w-4 ${formattingField === 'shipToAddress' ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* Details / Mode Section */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="h-4 w-4 text-orange-600" />
                  <h4 className="text-sm font-bold text-orange-600 uppercase">Details / Mode</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Mode of Delivery</label>
                    <Input
                      value={draft.modeOfDelivery}
                      onChange={(e) => setDraft({ ...draft, modeOfDelivery: e.target.value })}
                      placeholder="BY TRANSPORT"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Dispatch From</label>
                    <Input
                      value={draft.dispatchFrom}
                      onChange={(e) => setDraft({ ...draft, dispatchFrom: e.target.value })}
                      placeholder="e.g. MORBI"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Ref By / Attended By</label>
                    <Input
                      value={draft.refAttendedBy}
                      onChange={(e) => setDraft({ ...draft, refAttendedBy: e.target.value })}
                      placeholder="e.g. JASMIN SIR"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-orange-600" />
                    <h4 className="text-sm font-bold text-orange-600 uppercase">Line Items</h4>
                  </div>
                  <Button size="sm" variant="outline" onClick={addItem}>
                    <Plus className="h-3 w-3" /> Add Item
                  </Button>
                </div>
                {draft.items.map((item, i) => (
                  <div key={i} className="space-y-2 mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex gap-2 items-start">
                      <div className="flex-1">
                        <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Description *</label>
                        <div className="flex gap-1 mt-1">
                          <Input
                            placeholder="e.g. SJG 900W SERVO FILM WRAPPING MACHINE"
                            value={item.description}
                            onChange={(e) => updateItem(i, 'description', e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0"
                            onClick={() => handleFormatItemDescription(i)}
                            disabled={formattingField === `item-desc-${i}`}
                            title="AI Format Description"
                          >
                            <Wand2 className={`h-4 w-4 ${formattingField === `item-desc-${i}` ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>
                      <div className="w-28">
                        <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">HSN Code</label>
                        <Input
                          placeholder="84224000"
                          value={item.hsnCode}
                          onChange={(e) => updateItem(i, 'hsnCode', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="w-20">
                        <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Qty</label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="w-32">
                        <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Rate/PC (₹)</label>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="w-20">
                        <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">GST%</label>
                        <Input
                          type="number"
                          value={item.gstRate}
                          onChange={(e) => updateItem(i, 'gstRate', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="w-32 text-right">
                        <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Amount</label>
                        <div className="mt-1 h-10 flex items-center justify-end font-bold text-black dark:text-white">
                          ₹{((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      {draft.items.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => removeItem(i)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-80 space-y-2 text-sm p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>GST ({draft.items[0]?.gstRate || 18}%)</span>
                    <span>₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-bold text-black dark:text-white text-base border-t border-gray-200 dark:border-gray-700 pt-2">
                    <span>Grand Total</span>
                    <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!draft.customerName || createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {renderPreview()}
    </div>
  );
}
