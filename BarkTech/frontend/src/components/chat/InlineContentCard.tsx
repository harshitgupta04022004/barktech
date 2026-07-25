import { useState } from 'react';
import { contentApi } from '@/api/content';
import type { ContentItem, ReviewStatus } from '@/types/content';
import { Eye, Edit, Check, X, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineContentCardProps {
 content: ContentItem;
 onUpdate?: (updated: ContentItem) => void;
 onDelete?: (id: string) => void;
}

const statusConfig: Record<ReviewStatus, { label: string; color: string; bg: string }> = {
 draft: { label: 'Draft', color: 'text-gray-600', bg: 'bg-gray-100' },
 in_review: { label: 'In Review', color: 'text-yellow-600', bg: 'bg-yellow-100' },
 approved: { label: 'Approved', color: 'text-green-600', bg: 'bg-green-100' },
 rejected: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-100' },
};

export function InlineContentCard({ content, onUpdate, onDelete }: InlineContentCardProps) {
 const [expanded, setExpanded] = useState(false);
 const [editing, setEditing] = useState(false);
 const [editTitle, setEditTitle] = useState(content.title || '');
 const [editBody, setEditBody] = useState(content.body || content.excerpt || '');
 const [rejectReason, setRejectReason] = useState('');
 const [showReject, setShowReject] = useState(false);
 const [loading, setLoading] = useState(false);

 const status = statusConfig[content.reviewStatus] || statusConfig.draft;

 const handleApprove = async () => {
 setLoading(true);
 try {
 const result = await contentApi.approve(content._id);
 onUpdate?.(result.data);
 } catch (err) {
 console.error('Approve failed:', err);
 } finally {
 setLoading(false);
 }
 };

 const handleReject = async () => {
 if (!rejectReason.trim()) return;
 setLoading(true);
 try {
 const result = await contentApi.reject(content._id, rejectReason);
 onUpdate?.(result.data);
 setShowReject(false);
 setRejectReason('');
 } catch (err) {
 console.error('Reject failed:', err);
 } finally {
 setLoading(false);
 }
 };

 const handleSaveEdit = async () => {
 setLoading(true);
 try {
 const result = await contentApi.update(content._id, {
 title: editTitle,
 body: editBody,
 });
 onUpdate?.(result.data);
 setEditing(false);
 } catch (err) {
 console.error('Update failed:', err);
 } finally {
 setLoading(false);
 }
 };

 const handleDelete = async () => {
 if (!confirm('Delete this content?')) return;
 setLoading(true);
 try {
 await contentApi.delete(content._id);
 onDelete?.(content._id);
 } catch (err) {
 console.error('Delete failed:', err);
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
 <div className="flex items-center gap-2">
 <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', status.bg, status.color)}>
 {status.label}
 </span>
 <span className="text-xs text-muted-foreground">{content.contentType}</span>
 </div>
 <div className="flex items-center gap-1">
 <button
 onClick={() => setExpanded(!expanded)}
 className="rounded p-1 text-muted-foreground hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-muted"
 title="View"
 >
 <Eye className="h-4 w-4" />
 </button>
 <button
 onClick={() => { setEditing(!editing); setExpanded(true); }}
 className="rounded p-1 text-muted-foreground hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-muted"
 title="Edit"
 >
 <Edit className="h-4 w-4" />
 </button>
 {content.reviewStatus === 'in_review' && (
 <>
 <button
 onClick={handleApprove}
 disabled={loading}
 className="rounded p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-950 disabled:opacity-50"
 title="Approve"
 >
 <Check className="h-4 w-4" />
 </button>
 <button
 onClick={() => setShowReject(!showReject)}
 className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
 title="Reject"
 >
 <X className="h-4 w-4" />
 </button>
 </>
 )}
 <button
 onClick={handleDelete}
 disabled={loading}
 className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 disabled:opacity-50"
 title="Delete"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </div>
 </div>

 {/* Content */}
 <div className="px-4 py-3">
 {editing ? (
 <div className="space-y-3">
 <input
 type="text"
 value={editTitle}
 onChange={(e) => setEditTitle(e.target.value)}
 className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm "
 placeholder="Title"
 />
 <textarea
 value={editBody}
 onChange={(e) => setEditBody(e.target.value)}
 rows={4}
 className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm "
 placeholder="Content"
 />
 <div className="flex gap-2">
 <button
 onClick={handleSaveEdit}
 disabled={loading}
 className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-orange-600 disabled:opacity-50"
 >
 Save Changes
 </button>
 <button
 onClick={() => setEditing(false)}
 className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:text-muted-foreground"
 >
 Cancel
 </button>
 </div>
 </div>
 ) : (
 <>
 <h3 className="font-medium text-foreground">{content.title || 'Untitled'}</h3>
 {expanded && (content.body || content.excerpt) && (
 <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
 {content.body || content.excerpt}
 </p>
 )}
 {!expanded && (content.body || content.excerpt) && (
 <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
 {content.body || content.excerpt}
 </p>
 )}
 </>
 )}
 </div>

 {/* Reject reason input */}
 {showReject && (
 <div className="border-t border-gray-100 px-4 py-3">
 <textarea
 value={rejectReason}
 onChange={(e) => setRejectReason(e.target.value)}
 rows={2}
 className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm "
 placeholder="Rejection reason (required)"
 />
 <div className="mt-2 flex gap-2">
 <button
 onClick={handleReject}
 disabled={loading || !rejectReason.trim()}
 className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-red-600 disabled:opacity-50"
 >
 Confirm Reject
 </button>
 <button
 onClick={() => { setShowReject(false); setRejectReason(''); }}
 className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:text-muted-foreground"
 >
 Cancel
 </button>
 </div>
 </div>
 )}

 {/* Rejection reason display */}
 {content.reviewStatus === 'rejected' && content.reviewNotes && (
 <div className="border-t border-red-100 bg-red-50 px-4 py-3 dark:border-red-900/30 dark:bg-red-950/30">
 <div className="flex items-start gap-2">
 <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
 <div>
 <p className="text-xs font-medium text-red-600 dark:text-red-400">Rejection Reason</p>
 <p className="mt-0.5 text-sm text-red-700 dark:text-red-300">{content.reviewNotes}</p>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
