import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, Sparkles, RefreshCw, FileText, CheckCircle, Edit, Eye, Trash2, ChevronDown, ChevronUp, Package, Star } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ── Invoice Card Parser & Component (duplicated from ChatMessage for AdminAI) ──

function parseInvoiceCard(content: string): { card: any; textBefore: string; textAfter: string } | null {
  const cardRegex = /<INVOICE_CARD>\s*(\{[\s\S]*?\})\s*<\/INVOICE_CARD>/;
  const match = content.match(cardRegex);
  if (!match || match.index === undefined) return null;
  try {
    const card = JSON.parse(match[1]);
    const before = content.substring(0, match.index).trim();
    const after = content.substring(match.index + match[0].length).trim();
    return { card, textBefore: before, textAfter: after };
  } catch {
    return null;
  }
}

// Parse DELETE_CONFIRM tag from assistant response
function parseDeleteConfirm(content: string): { invoiceId: string; invoiceNumber: string; textBefore: string; textAfter: string } | null {
  const regex = /<DELETE_CONFIRM>([\w:]+)<\/DELETE_CONFIRM>/;
  const match = content.match(regex);
  if (!match || match.index === undefined) return null;
  const parts = match[1].split(':');
  if (parts.length !== 2) return null;
  const before = content.substring(0, match.index).trim();
  const after = content.substring(match.index + match[0].length).trim();
  return { invoiceId: parts[0], invoiceNumber: parts[1], textBefore: before, textAfter: after };
}

// ── Status badge colors ──
const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  partially_paid: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  cancelled: 'bg-gray-100 text-muted-foreground',
};

function getCardStatus(card: any): string {
  return card.status || 'draft';
}

function getCardStatusLabel(status: string): string {
  return status.replace('_', ' ');
}

/**
 * Landscape invoice card for chat — matches the table row style in /admin/invoices.
 *
 * Renders:
 * - Compact row: invoice #, customer, amount, status badge, date
 * - Quick summary: items, subtotal/GST/total
 * - 3 actions: View (expand), Edit, Delete
 *
 * For drafts (pre-confirm), shows Confirm & Edit in Form buttons.
 */
function InlineInvoiceCard({
  card,
  onConfirm,
  onEdit,
  onDelete,
  onEditInline,
}: {
  card: any;
  onConfirm?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onEditInline?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const fmt = (n: number) => n?.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const status = getCardStatus(card);
  const isDraft = status === 'draft' && !card.invoice_id;
  const hasInvoiceId = !!card.invoice_id;

  return (
    <div className="border border-orange-200 dark:border-orange-800 rounded-xl overflow-hidden my-2">
      {/* ── Compact Row (landscape style) ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-orange-50 dark:bg-orange-950/30 border-b border-orange-200 dark:border-orange-800">
        <FileText className="h-4 w-4 text-orange-600 shrink-0" />
        <span className="text-sm font-mono font-bold text-orange-700 dark:text-orange-300">
          {card.invoice_number || 'Draft'}
        </span>
        {card.customer_name && (
          <span className="text-sm font-medium text-foreground truncate">
            {card.customer_name}
          </span>
        )}
        {card.total != null && (
          <span className="text-sm font-bold text-orange-600 dark:text-orange-400 ml-auto shrink-0">
            ₹{fmt(card.total)}
          </span>
        )}
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColors[status] || ''}`}
        >
          {getCardStatusLabel(status)}
        </span>
        {card.created_at && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            {new Date(card.created_at).toLocaleDateString('en-IN')}
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div className="px-4 py-3 space-y-2">
        {/* Customer + Company summary */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {card.customer_name && (
            <div>
              <span className="text-muted-foreground">Customer:</span>
              <span className="ml-1 font-medium text-foreground">{card.customer_name}</span>
            </div>
          )}
          {card.customer_company && (
            <div>
              <span className="text-muted-foreground">Company:</span>
              <span className="ml-1 font-medium text-foreground">{card.customer_company}</span>
            </div>
          )}
          {card.customer_email && (
            <div>
              <span className="text-muted-foreground">Email:</span>
              <span className="ml-1 font-medium text-foreground">{card.customer_email}</span>
            </div>
          )}
          {card.customer_phone && (
            <div>
              <span className="text-muted-foreground">Phone:</span>
              <span className="ml-1 font-medium text-foreground">{card.customer_phone}</span>
            </div>
          )}
        </div>

        {/* Line items summary */}
        {card.items && card.items.length > 0 && (
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-1">Item</th>
                <th className="text-right py-1">Qty</th>
                <th className="text-right py-1">Rate</th>
                <th className="text-right py-1">GST</th>
                <th className="text-right py-1">Amount</th>
              </tr>
            </thead>
            <tbody>
              {card.items.map((item: any, i: number) => (
                <tr key={i} className="border-b border-border">
                  <td className="py-0.5">{item.description}</td>
                  <td className="text-right py-0.5">{item.quantity}</td>
                  <td className="text-right py-0.5">₹{fmt(item.unitPrice)}</td>
                  <td className="text-right py-0.5">{item.gstRate}%</td>
                  <td className="text-right py-0.5 font-medium">₹{fmt(item.amount || item.quantity * item.unitPrice * (1 + item.gstRate / 100))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Totals */}
        <div className="flex justify-end text-xs space-x-4 border-t border-border pt-2">
          {card.subtotal != null && <span className="text-muted-foreground">Subtotal: ₹{fmt(card.subtotal)}</span>}
          {card.gst_amount != null && <span className="text-muted-foreground">GST: ₹{fmt(card.gst_amount)}</span>}
          {card.total != null && <span className="font-bold text-orange-600 dark:text-orange-400">Total: ₹{fmt(card.total)}</span>}
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-2 pt-1">
          {isDraft && onConfirm && (
            <Button size="sm" onClick={onConfirm} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="h-3 w-3 mr-1" /> Confirm
            </Button>
          )}
          {hasInvoiceId && (
            <>
              <Button size="sm" variant="outline" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                {expanded ? 'Collapse' : 'Details'}
              </Button>
              <Button size="sm" variant="outline" onClick={onEditInline || onEdit}>
                <Edit className="h-3 w-3 mr-1" /> Edit
              </Button>
              <Button size="sm" variant="outline" onClick={onDelete} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            </>
          )}
        </div>

        {/* ── Expanded Detail ── */}
        {expanded && hasInvoiceId && (
          <div className="border-t border-border pt-3 mt-2 space-y-3 text-xs">
            {/* Bill To / Ship To */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-border rounded p-2">
                <div className="font-bold text-orange-600 uppercase text-[10px] mb-1 border-b border-orange-600 pb-0.5">Bill To</div>
                <div className="font-medium text-foreground">{card.customer_name}</div>
                {card.customer_company && <div className="text-muted-foreground">{card.customer_company}</div>}
                {card.customer_address && <div className="text-muted-foreground whitespace-pre-line">{card.customer_address}</div>}
                {card.customer_gst && <div className="text-muted-foreground"><strong>GSTIN:</strong> {card.customer_gst}</div>}
                {card.customer_phone && <div className="text-muted-foreground"><strong>Phone:</strong> {card.customer_phone}</div>}
                {card.ref_attended_by && <div className="text-muted-foreground"><strong>Ref/Attended:</strong> {card.ref_attended_by}</div>}
              </div>
              <div className="border border-border rounded p-2">
                <div className="font-bold text-orange-600 uppercase text-[10px] mb-1 border-b border-orange-600 pb-0.5">Ship To</div>
                <div className="text-muted-foreground whitespace-pre-line">{card.ship_to_address || 'Same as Bill To'}</div>
                {card.mode_of_delivery && <div className="mt-1"><strong>Mode:</strong> {card.mode_of_delivery}</div>}
                {card.dispatch_from && <div><strong>Dispatch:</strong> {card.dispatch_from}</div>}
              </div>
            </div>

            {/* Details / Mode */}
            <div className="border border-border rounded p-2">
              <div className="font-bold text-orange-600 uppercase text-[10px] mb-1 border-b border-orange-600 pb-0.5">Details / Mode</div>
              <div className="grid grid-cols-2 gap-1">
                {card.invoice_number && <div><strong>Invoice #:</strong> {card.invoice_number}</div>}
                {card.created_at && <div><strong>Date:</strong> {new Date(card.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
                {card.mode_of_delivery && <div><strong>Mode:</strong> {card.mode_of_delivery}</div>}
                {card.dispatch_from && <div><strong>Dispatch From:</strong> {card.dispatch_from}</div>}
              </div>
            </div>

            {/* Bank Details */}
            {(card.bank_name || card.bank_account_no) && (
              <div className="border border-border rounded p-2">
                <div className="font-bold text-orange-600 uppercase text-[10px] mb-1 border-b border-orange-600 pb-0.5">Bank Details</div>
                <div className="grid grid-cols-2 gap-1">
                  {card.bank_name && <div><strong>Beneficiary:</strong> {card.bank_name}</div>}
                  {card.bank_bank && <div><strong>Bank:</strong> {card.bank_bank}</div>}
                  {card.bank_account_no && <div><strong>A/c No:</strong> {card.bank_account_no}</div>}
                  {card.bank_ifsc_code && <div><strong>IFSC:</strong> {card.bank_ifsc_code}</div>}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="border border-border rounded p-2">
              <div className="flex justify-between text-xs">
                <div>
                  {card.subtotal != null && <div>Subtotal: ₹{fmt(card.subtotal)}</div>}
                  {card.gst_amount != null && <div>GST: ₹{fmt(card.gst_amount)}</div>}
                  {card.amount_in_words && <div className="text-[10px] italic text-muted-foreground mt-1">{card.amount_in_words}</div>}
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-600 text-sm">Total: ₹{fmt(card.total)}</div>
                  {card.currency && <div className="text-[10px] text-muted-foreground">{card.currency}</div>}
                </div>
              </div>
            </div>

            {/* Notes */}
            {card.notes && (
              <div className="text-xs">
                <strong>Notes:</strong> <span className="text-muted-foreground">{card.notes}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Product Card Parser & Component ──

function parseProductCard(content: string): { card: any; textBefore: string; textAfter: string } | null {
  const cardRegex = /<PRODUCT_CARD>\s*(\{[\s\S]*?\})\s*<\/PRODUCT_CARD>/;
  const match = content.match(cardRegex);
  if (!match || match.index === undefined) return null;
  try {
    const card = JSON.parse(match[1]);
    const before = content.substring(0, match.index).trim();
    const after = content.substring(match.index + match[0].length).trim();
    return { card, textBefore: before, textAfter: after };
  } catch {
    return null;
  }
}

function parseProductDeleteConfirm(content: string): { productId: string; productName: string; textBefore: string; textAfter: string } | null {
  const regex = /<DELETE_CONFIRM>product:([\w]+):([\s\S]*?)<\/DELETE_CONFIRM>/;
  const match = content.match(regex);
  if (!match || match.index === undefined) return null;
  const before = content.substring(0, match.index).trim();
  const after = content.substring(match.index + match[0].length).trim();
  return { productId: match[1], productName: match[2], textBefore: before, textAfter: after };
}

const productStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:text-gray-300',
  published: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  archived: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
};

function InlineProductCard({
  card,
  onEdit,
  onDelete,
  onView,
}: {
  card: any;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = card.published ? 'published' : (card.reviewStatus || 'draft');
  const hasId = !!(card.product_id || card._id);
  const thumbnail = card.media && card.media[0]?.url;

  return (
    <div className="border border-blue-200 dark:border-blue-800 rounded-xl overflow-hidden my-2">
      {/* ── Compact Row ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800">
        {thumbnail ? (
          <img src={thumbnail} alt={card.name || 'Product'} className="h-8 w-8 rounded object-cover shrink-0" />
        ) : (
          <div className="h-8 w-8 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        )}
        <span className="text-sm font-bold text-blue-700 dark:text-blue-300 truncate max-w-[200px]">
          {card.name || 'Untitled'}
        </span>
        {card.category && (
          <span className="text-[10px] text-muted-foreground shrink-0">{card.category}</span>
        )}
        {card.is_featured && (
          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
        )}
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${productStatusColors[status] || productStatusColors.draft}`}
        >
          {status}
        </span>
        <span className="text-[10px] text-muted-foreground shrink-0 ml-auto">
          {card.published ? 'Live' : 'Draft'}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="px-4 py-3 space-y-2">
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {card.shortDescription && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Description:</span>
              <span className="ml-1 font-medium text-foreground line-clamp-2">{card.shortDescription}</span>
            </div>
          )}
          {card.models && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Models:</span>
              <span className="ml-1 font-medium text-foreground">{card.models}</span>
            </div>
          )}
          {card.leadTimeDays != null && card.leadTimeDays > 0 && (
            <div>
              <span className="text-muted-foreground">Lead Time:</span>
              <span className="ml-1 font-medium text-foreground">{card.leadTimeDays} days</span>
            </div>
          )}
          {card.warrantyMonths != null && card.warrantyMonths > 0 && (
            <div>
              <span className="text-muted-foreground">Warranty:</span>
              <span className="ml-1 font-medium text-foreground">{card.warrantyMonths} months</span>
            </div>
          )}
        </div>

        {/* Specs preview */}
        {card.specs && card.specs.length > 0 && (
          <div className="text-[11px]">
            <span className="text-muted-foreground">Specs ({card.specs.length}):</span>
            <span className="ml-1 text-muted-foreground">
              {card.specs.slice(0, 3).map((s: any) => `${s.key}: ${s.value}`).join(' | ')}
              {card.specs.length > 3 && ` +${card.specs.length - 3} more`}
            </span>
          </div>
        )}

        {/* Media preview */}
        {card.media && card.media.length > 0 && (
          <div className="text-[11px] text-muted-foreground">
            Media: {card.media.length} file{card.media.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* ── Actions ── */}
        {hasId && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              {expanded ? 'Collapse' : 'Details'}
            </Button>
            {onView && (
              <Button size="sm" variant="outline" onClick={onView}>
                <Eye className="h-3 w-3 mr-1" /> View
              </Button>
            )}
            {onEdit && (
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Edit className="h-3 w-3 mr-1" /> Edit
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="outline" onClick={onDelete} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            )}
          </div>
        )}

        {/* ── Expanded Detail ── */}
        {expanded && hasId && (
          <div className="border-t border-border pt-3 mt-2 space-y-3 text-xs">
            {card.description && (
              <div>
                <div className="font-bold text-blue-600 uppercase text-[10px] mb-1">Full Description</div>
                <div className="text-muted-foreground whitespace-pre-line">{card.description}</div>
              </div>
            )}
            {card.specs && card.specs.length > 0 && (
              <div>
                <div className="font-bold text-blue-600 uppercase text-[10px] mb-1">Specifications</div>
                <div className="grid grid-cols-2 gap-1">
                  {card.specs.map((spec: any, i: number) => (
                    <div key={i} className="flex justify-between border-b border-border pb-1">
                      <span className="text-muted-foreground">{spec.key}</span>
                      <span className="font-medium text-foreground">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {card.media && card.media.length > 0 && (
              <div>
                <div className="font-bold text-blue-600 uppercase text-[10px] mb-1">Media</div>
                <div className="flex gap-2 flex-wrap">
                  {card.media.map((m: any, i: number) => (
                    <img key={i} src={m.url} alt={m.alt || ''} className="h-16 w-16 rounded object-cover" />
                  ))}
                </div>
              </div>
            )}
            {card.llmExtractedData && (
              <div className="border border-dashed border-blue-300 dark:border-blue-700 rounded p-2">
                <div className="font-bold text-blue-600 uppercase text-[10px] mb-1">AI Extracted Data</div>
                <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap overflow-x-auto max-h-40">
                  {JSON.stringify(card.llmExtractedData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getToken(): string | null {
  return localStorage.getItem('bark_auth_token');
}

export function AdminAI() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am the **Bark Technologies Admin AI**. I can help you with:\n\n- **Product management** — search, specs, inventory\n- **Lead management** — create and track inquiries\n- **Invoice operations** — create invoices, view stats\n- **Business analytics** — get insights on your data\n\nHow can I assist you today?' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: healthData } = useQuery({
    queryKey: ['agent-health'],
    queryFn: async () => {
      try {
        const res = await fetch('/agent/health');
        return res.json();
      } catch {
        return { status: 'unreachable' };
      }
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const msgText = overrideText ?? input.trim();
    if (!msgText || isLoading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msgText }]);
    setIsLoading(true);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const token = getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/agent/admin/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: msgText }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const errorMsg = errorBody.detail || errorBody.error || `Agent request failed (${res.status})`;
        setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${errorMsg}` }]);
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream')) {
        const reader = res.body?.getReader();
        if (!reader) {
          setMessages((prev) => [...prev, { role: 'assistant', content: 'Error: No response stream' }]);
          return;
        }
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.trim() === '[DONE]') continue;
            const dataMatch = line.match(/^data:\s*(.+)$/s);
            if (!dataMatch) continue;
            const data = dataMatch[1].trim();
            if (data && data !== '[DONE]') {
              fullContent += data;
            }
          }
        }
        setMessages((prev) => [...prev, { role: 'assistant', content: fullContent || 'No response received.' }]);
      } else {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response || 'No response received.' }]);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Error connecting to AI agent. Please check:\n1. Agent service is running on port 8000\n2. You are logged in as admin\n3. Try again in a moment',
      }]);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading]);

  const clearChat = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setMessages([
      { role: 'assistant', content: 'Chat cleared. How can I help you?' },
    ]);
  };

  const handleConfirmInvoice = (card: any) => {
    sendMessage('CONFIRM_INVOICE: ' + JSON.stringify(card));
  };

  const handleEditInvoice = (card: any) => {
    sendMessage('Edit invoice ' + (card.invoice_number || card.invoice_id || 'draft') + '. What would you like to change?');
  };

  const handleDeleteInvoice = (card: any) => {
    sendMessage('DELETE_INVOICE: ' + JSON.stringify({ invoice_id: card.invoice_id, invoice_number: card.invoice_number }));
  };

  const handleConfirmDelete = (invoiceId: string, invoiceNumber: string) => {
    sendMessage('DELETE_INVOICE_CONFIRM: ' + invoiceId + ':' + invoiceNumber);
  };

  const handleEditInline = (card: any) => {
    sendMessage('Edit invoice ' + (card.invoice_number || 'this invoice') + '. What would you like to change?');
  };

  // ── Product handlers ──
  const handleEditProduct = (card: any) => {
    const id = card.product_id || card._id;
    sendMessage('Edit product ' + (id || card.name || 'this product') + '. What would you like to change?');
  };

  const handleDeleteProduct = (card: any) => {
    const id = card.product_id || card._id;
    sendMessage('DELETE_PRODUCT: ' + JSON.stringify({ product_id: id, product_name: card.name }));
  };

  const handleViewProduct = (card: any) => {
    const id = card.product_id || card._id;
    sendMessage('View product ' + id);
  };

  const handleConfirmProductDelete = (productId: string, productName: string) => {
    sendMessage('DELETE_PRODUCT_CONFIRM: ' + productId + ':' + productName);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">AI Agent</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${healthData?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-muted-foreground">{healthData?.status === 'ok' ? 'Agent Online' : 'Agent Offline'}</span>
          </div>
          <Button variant="outline" size="sm" onClick={clearChat}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      <Card className="" style={{ height: 'calc(100vh - 240px)', minHeight: '400px' }}>
        <div className="flex h-full flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start gap-2 max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-1">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`rounded-xl px-4 py-3 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (() => {
                      const productCard = parseProductCard(msg.content);
                      const productDeleteConfirm = parseProductDeleteConfirm(msg.content);
                      const card = parseInvoiceCard(msg.content);
                      const deleteConfirm = parseDeleteConfirm(msg.content);
                      if (productCard) {
                        return (
                          <>
                            {productCard.textBefore && (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
                                }}>{productCard.textBefore}</ReactMarkdown>
                              </div>
                            )}
                            <InlineProductCard
                              card={productCard.card}
                              onEdit={() => handleEditProduct(productCard.card)}
                              onDelete={() => handleDeleteProduct(productCard.card)}
                              onView={() => handleViewProduct(productCard.card)}
                            />
                            {productCard.textAfter && (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
                                }}>{productCard.textAfter}</ReactMarkdown>
                              </div>
                            )}
                          </>
                        );
                      }
                      if (productDeleteConfirm) {
                        return (
                          <>
                            {productDeleteConfirm.textBefore && (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
                                }}>{productDeleteConfirm.textBefore}</ReactMarkdown>
                              </div>
                            )}
                            <div className="flex gap-2 my-2">
                              <Button size="sm" onClick={() => handleConfirmProductDelete(productDeleteConfirm.productId, productDeleteConfirm.productName)} className="bg-red-600 hover:bg-red-700 text-white">
                                <Trash2 className="h-3 w-3 mr-1" /> Confirm Delete
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => sendMessage('No, cancel the delete.')}>
                                Cancel
                              </Button>
                            </div>
                            {productDeleteConfirm.textAfter && (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
                                }}>{productDeleteConfirm.textAfter}</ReactMarkdown>
                              </div>
                            )}
                          </>
                        );
                      }
                      if (card) {
                        return (
                          <>
                            {card.textBefore && (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
                                }}>{card.textBefore}</ReactMarkdown>
                              </div>
                            )}
                            <InlineInvoiceCard
                              card={card.card}
                              onConfirm={() => handleConfirmInvoice(card.card)}
                              onEdit={() => handleEditInvoice(card.card)}
                              onDelete={() => handleDeleteInvoice(card.card)}
                              onEditInline={() => handleEditInline(card.card)}
                            />
                            {card.textAfter && (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
                                }}>{card.textAfter}</ReactMarkdown>
                              </div>
                            )}
                          </>
                        );
                      }
                      if (deleteConfirm) {
                        return (
                          <>
                            {deleteConfirm.textBefore && (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
                                }}>{deleteConfirm.textBefore}</ReactMarkdown>
                              </div>
                            )}
                            <div className="flex gap-2 my-2">
                              <Button size="sm" onClick={() => handleConfirmDelete(deleteConfirm.invoiceId, deleteConfirm.invoiceNumber)} className="bg-red-600 hover:bg-red-700 text-white">
                                <Trash2 className="h-3 w-3 mr-1" /> Confirm Delete
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => sendMessage('No, cancel the delete.')}>
                                Cancel
                              </Button>
                            </div>
                            {deleteConfirm.textAfter && (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
                                }}>{deleteConfirm.textAfter}</ReactMarkdown>
                              </div>
                            )}
                          </>
                        );
                      }
                      return (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-strong:font-semibold prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                            a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
                          }}>{msg.content}</ReactMarkdown>
                        </div>
                      );
                    })() : (
                      msg.content
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-1">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-xl rounded-bl-sm px-4 py-3 text-sm text-muted-foreground">
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-4 flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask the AI agent anything..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
