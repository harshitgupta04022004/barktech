import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { contentApi } from '@/api/content';
import type { ContentItem, ContentType, ReviewStatus } from '@/types/content';
import {
  Search, Eye, Edit, Trash2, Check, X, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const contentTypeConfig: Record<ContentType, { label: string; color: string; bg: string }> = {
  blog: { label: 'Blog', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  news: { label: 'News', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  case_study: { label: 'Case Study', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  installation: { label: 'Installation', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  general: { label: 'General', color: 'text-gray-600', bg: 'bg-muted' },
};

const reviewStatusConfig: Record<ReviewStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bg: 'bg-muted' },
  in_review: { label: 'In Review', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  approved: { label: 'Approved', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  rejected: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
};

export function AdminContent() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('type') || 'all');
  const [reviewFilter, setReviewFilter] = useState<string>(searchParams.get('reviewStatus') || 'all');

  const fetchContent = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50, offset: 0 };
      if (activeTab !== 'all') params.type = activeTab;
      if (reviewFilter !== 'all') params.reviewStatus = reviewFilter;
      if (search) params.search = search;
      const result = await contentApi.list(params);
      setItems(result.data);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to fetch content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [activeTab, reviewFilter, search]);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type) setActiveTab(type);
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content</h1>
          <p className="text-sm text-muted-foreground">
            Manage blog posts, news, case studies, and social content
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground"
          />
        </div>

        {/* Content type tabs */}
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {['all', 'blog', 'news', 'case_study', 'general'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                activeTab === tab
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              )}
            >
              {tab === 'all' ? 'All' : contentTypeConfig[tab as ContentType]?.label || tab}
            </button>
          ))}
        </div>

        {/* Review status filter */}
        <select
          value={reviewFilter}
          onChange={(e) => setReviewFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Content Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <FileText className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-muted-foreground">
              No content drafted yet — try asking the AI Agent to draft your first post
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Link Target
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item) => {
                const typeConfig = contentTypeConfig[item.contentType] || contentTypeConfig.general;
                const statusConfig = reviewStatusConfig[item.reviewStatus] || reviewStatusConfig.draft;
                return (
                  <tr key={item._id} className="hover:bg-accent">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{item.title || 'Untitled'}</div>
                      {item.excerpt && (
                        <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                          {item.excerpt}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', typeConfig.bg, typeConfig.color)}>
                        {typeConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusConfig.bg, statusConfig.color)}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {item.productId ? 'Product' : item.pageSlug ? item.pageSlug : (
                        <span className="text-red-500">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="rounded p-1 text-muted-foreground hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="rounded p-1 text-muted-foreground hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        {item.reviewStatus === 'in_review' && (
                          <>
                            <button className="rounded p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-950" title="Approve">
                              <Check className="h-4 w-4" />
                            </button>
                            <button className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950" title="Reject">
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {total > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {items.length} of {total} items
        </p>
      )}
    </div>
  );
}
