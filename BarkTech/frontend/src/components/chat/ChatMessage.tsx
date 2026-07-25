import { useState, useCallback } from 'react';
import { Copy, Check, ChevronDown, ChevronRight, Wrench, FileText, CheckCircle, Edit, Eye, Trash2, ChevronUp, Package, Star } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { StructuredResponse, parseStructuredContent } from './StructuredResponse';
import type { ChatMessage as ChatMessageType } from '@/stores/chatStore';
import type { ChatFile } from '@/api/agentChat';

interface ChatMessageProps {
 message: ChatMessageType;
 onSendMessage?: (msg: string) => void;
}

/**
 * Strip agent tool_call XML tags from response content.
 * The agent sometimes emits raw XML like <tool_call>...</tool_call> in its response text.
 */
function stripToolCallXml(content: string): string {
 return content.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '').replace(/<function_call>[\s\S]*?<\/function_call>/g, '').trim();
}

function CodeBlock({ language, children }: { language: string; children: string }) {
 const [copied, setCopied] = useState(false);

 const handleCopy = useCallback(() => {
 navigator.clipboard.writeText(children);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 }, [children]);

 return (
 <div className="relative my-3 rounded-lg overflow-hidden">
 <div className="flex items-center justify-between bg-muted px-4 py-1.5">
 <span className="text-xs text-muted-foreground">{language || 'code'}</span>
 <button
 onClick={handleCopy}
 className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
 >
 {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
 {copied ? 'Copied' : 'Copy'}
 </button>
 </div>
 <SyntaxHighlighter
 style={oneDark}
 language={language || 'text'}
 PreTag="div"
 customStyle={{
 margin: 0,
 borderRadius: 0,
 fontSize: '13px',
 lineHeight: '1.5',
 }}
 >
 {children}
 </SyntaxHighlighter>
 </div>
 );
}

function ToolCallBlock({ name, args }: { name: string; args: Record<string, unknown> }) {
 const [expanded, setExpanded] = useState(false);

 return (
 <div className="my-2 rounded-lg border border-border overflow-hidden">
 <button
 onClick={() => setExpanded(!expanded)}
 className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-accent transition-colors"
 >
 <Wrench className="h-3 w-3" />
 <span className="font-medium">Used tool: {name}</span>
 {expanded ? (
 <ChevronDown className="ml-auto h-3 w-3" />
 ) : (
 <ChevronRight className="ml-auto h-3 w-3" />
 )}
 </button>
 {expanded && (
 <div className="border-t border-border bg-card px-3 py-2">
 <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
 {JSON.stringify(args, null, 2)}
 </pre>
 </div>
 )}
 </div>
 );
}

function FileAttachment({ file }: { file: ChatFile }) {
 const formatSize = (bytes: number) => {
 if (bytes < 1024) return `${bytes}B`;
 if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
 return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
 };

 if (file.preview) {
 return (
 <div className="mt-1.5">
 <img
 src={file.preview}
 alt={file.filename}
 className="max-h-48 rounded-lg border border-border object-contain"
 />
 <p className="mt-1 text-[10px] text-muted-foreground">{file.filename} ({formatSize(file.size)})</p>
 </div>
 );
 }

 return (
 <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2">
 <span className="flex h-8 w-8 items-center justify-center rounded bg-muted">
 <FileText className="h-4 w-4 text-muted-foreground" />
 </span>
 <div>
 <p className="text-xs font-medium text-foreground">{file.filename}</p>
 <p className="text-[10px] text-muted-foreground">{formatSize(file.size)}</p>
 </div>
 </div>
 );
}


// ── Invoice Card Parser & Component ──────────────────

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
 draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
 sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
 paid: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
 partially_paid: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
 overdue: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
 cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

function getCardStatus(card: any): string {
 return card.status || 'draft';
}

function getCardStatusLabel(status: string): string {
 return status.replace('_', ' ');
}

function InvoiceCard({
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
 <Button size="sm" onClick={onConfirm} className="bg-green-600 hover:bg-green-700 text-primary-foreground">
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


// ── Product Card Parser & Component ──────────────────

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
 draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
 published: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
 archived: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
};

function ProductCard({
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
 <div className="border border-dashed border-border rounded p-2">
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


export function ChatMessage({ message, onSendMessage }: ChatMessageProps) {
 const [copied, setCopied] = useState(false);

 const handleCopy = useCallback(() => {
 navigator.clipboard.writeText(stripToolCallXml(message.content));
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 }, [message.content]);

 if (message.role === 'user') {
 return (
 <div className="flex justify-end py-4">
 <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-muted px-4 py-3 text-sm text-foreground">
 {/* File attachments */}
 {message.files && message.files.length > 0 && (
 <div className="mb-2">
 {message.files.map((file) => (
 <FileAttachment key={file.id} file={file} />
 ))}
 </div>
 )}
 <p className="whitespace-pre-wrap">{message.content}</p>
 </div>
 </div>
 );
 }

 // Assistant message — strip tool call XML that the agent leaks into content
 const cleanContent = stripToolCallXml(message.content);

 // Check if content has structured XML tags (new unified parser)
 const hasStructuredContent = parseStructuredContent(cleanContent).length > 0;

 // Legacy parsers for backward compatibility
 const productCard = !hasStructuredContent ? parseProductCard(cleanContent) : null;
 const productDeleteConfirm = !hasStructuredContent && !productCard ? parseProductDeleteConfirm(cleanContent) : null;
 const invoiceCard = !hasStructuredContent && !productCard && !productDeleteConfirm ? parseInvoiceCard(cleanContent) : null;
 const deleteConfirm = !hasStructuredContent && !productCard && !productDeleteConfirm && !invoiceCard ? parseDeleteConfirm(cleanContent) : null;

 // Markdown renderer component for reuse
 const MarkdownRenderer = ({ children }: { children: string }) => (
   <ReactMarkdown
     remarkPlugins={[remarkGfm]}
     components={{
       code({ className, children, ...props }) {
         const match = /language-(\w+)/.exec(className || '');
         const codeString = String(children).replace(/\n$/, '');
         if (match) {
           return <CodeBlock language={match[1]} children={codeString} />;
         }
         return (
           <code className={className} {...props}>
             {children}
           </code>
         );
       },
       a: ({ href, children }) => (
         <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#e65100] hover:underline">
           {children}
         </a>
       ),
     }}
   >
     {children}
   </ReactMarkdown>
 );

 return (
   <div className="group flex items-start gap-3 py-4">
     {/* Avatar */}
     <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#e65100]/10 mt-0.5">
       <span className="text-xs font-bold text-[#e65100]">BT</span>
     </div>

     {/* Content */}
     <div className="flex-1 min-w-0">
       {/* Tool calls */}
       {message.toolCalls?.map((tc, i) => (
         <ToolCallBlock key={i} name={tc.name} args={tc.args} />
       ))}

       {/* Message content */}
       {cleanContent && (
         <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-3 prose-headings:mb-1.5 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0 prose-strong:font-semibold prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:p-0">
           {/* Use unified StructuredResponse for new tags */}
           {hasStructuredContent ? (
             <StructuredResponse
               content={cleanContent}
               onSendMessage={onSendMessage}
               MarkdownRenderer={MarkdownRenderer}
             />
           ) : productCard ? (
             <>
               {productCard.textBefore && <MarkdownRenderer>{productCard.textBefore}</MarkdownRenderer>}
               <ProductCard
                 card={productCard.card}
                 onEdit={() => {
                   if (onSendMessage) {
                     const id = productCard.card.product_id || productCard.card._id;
                     onSendMessage('Edit product ' + (id || productCard.card.name || 'this product') + '. What would you like to change?');
                   }
                 }}
                 onDelete={() => {
                   if (onSendMessage) {
                     const id = productCard.card.product_id || productCard.card._id;
                     onSendMessage('DELETE_PRODUCT: ' + JSON.stringify({ product_id: id, product_name: productCard.card.name }));
                   }
                 }}
                 onView={() => {
                   if (onSendMessage) {
                     const id = productCard.card.product_id || productCard.card._id;
                     onSendMessage('View product ' + id);
                   }
                 }}
               />
               {productCard.textAfter && <MarkdownRenderer>{productCard.textAfter}</MarkdownRenderer>}
             </>
           ) : productDeleteConfirm ? (
             <>
               {productDeleteConfirm.textBefore && <MarkdownRenderer>{productDeleteConfirm.textBefore}</MarkdownRenderer>}
               <div className="flex gap-2 my-2">
                 <Button size="sm" onClick={() => {
                   if (onSendMessage) {
                     onSendMessage('DELETE_PRODUCT_CONFIRM: ' + productDeleteConfirm.productId + ':' + productDeleteConfirm.productName);
                   }
                 }} className="bg-red-600 hover:bg-red-700 text-primary-foreground">
                   Confirm Delete
                 </Button>
                 <Button size="sm" variant="outline" onClick={() => {
                   if (onSendMessage) {
                     onSendMessage('No, cancel the delete.');
                   }
                 }}>
                   Cancel
                 </Button>
               </div>
               {productDeleteConfirm.textAfter && <MarkdownRenderer>{productDeleteConfirm.textAfter}</MarkdownRenderer>}
             </>
           ) : invoiceCard ? (
             <>
               {invoiceCard.textBefore && <MarkdownRenderer>{invoiceCard.textBefore}</MarkdownRenderer>}
               <InvoiceCard
                 card={invoiceCard.card}
                 onConfirm={() => {
                   if (onSendMessage) {
                     onSendMessage('CONFIRM_INVOICE: ' + JSON.stringify(invoiceCard.card));
                   }
                 }}
                 onEdit={() => {
                   if (onSendMessage) {
                     onSendMessage('Edit invoice ' + (invoiceCard.card.invoice_number || invoiceCard.card.invoice_id || 'draft') + '. What would you like to change?');
                   }
                 }}
                 onDelete={() => {
                   if (onSendMessage) {
                     onSendMessage('DELETE_INVOICE: ' + JSON.stringify({ invoice_id: invoiceCard.card.invoice_id, invoice_number: invoiceCard.card.invoice_number }));
                   }
                 }}
                 onEditInline={() => {
                   if (onSendMessage) {
                     onSendMessage('Edit invoice ' + (invoiceCard.card.invoice_number || 'this invoice') + '. What would you like to change?');
                   }
                 }}
               />
               {invoiceCard.textAfter && <MarkdownRenderer>{invoiceCard.textAfter}</MarkdownRenderer>}
             </>
           ) : deleteConfirm ? (
             <>
               {deleteConfirm.textBefore && <MarkdownRenderer>{deleteConfirm.textBefore}</MarkdownRenderer>}
               <div className="flex gap-2 my-2">
                 <Button size="sm" onClick={() => {
                   if (onSendMessage) {
                     onSendMessage('DELETE_INVOICE_CONFIRM: ' + deleteConfirm.invoiceId + ':' + deleteConfirm.invoiceNumber);
                   }
                 }} className="bg-red-600 hover:bg-red-700 text-primary-foreground">
                   Confirm Delete
                 </Button>
                 <Button size="sm" variant="outline" onClick={() => {
                   if (onSendMessage) {
                     onSendMessage('No, cancel the delete.');
                   }
                 }}>
                   Cancel
                 </Button>
               </div>
               {deleteConfirm.textAfter && <MarkdownRenderer>{deleteConfirm.textAfter}</MarkdownRenderer>}
             </>
           ) : (
             <MarkdownRenderer>{cleanContent}</MarkdownRenderer>
           )}
         </div>
       )}

       {/* Copy button — visible on hover */}
       {cleanContent && (
         <button
           onClick={handleCopy}
           className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
         >
           {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
           {copied ? 'Copied' : 'Copy'}
         </button>
       )}
     </div>
   </div>
 );
}
