import { FileText, Calendar, Tag, Globe } from 'lucide-react';

interface BlogPreviewData {
  content_id: string;
  title: string;
  slug?: string;
  content_type?: string;
  excerpt?: string;
  body_html?: string;
  cover_image?: string;
  author?: string;
  published?: boolean;
  published_at?: string;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  social_publish_status?: Record<string, string>;
}

interface BlogPreviewProps {
  data: BlogPreviewData;
  type?: string;
}

const typeLabels: Record<string, string> = {
  BLOG_LAYOUT: 'Blog Post',
  NEWS_LAYOUT: 'News Article',
  CASE_STUDY_LAYOUT: 'Case Study',
};

const typeColors: Record<string, string> = {
  BLOG_LAYOUT: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  NEWS_LAYOUT: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  CASE_STUDY_LAYOUT: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

export function BlogPreview({ data, type = 'BLOG_LAYOUT' }: BlogPreviewProps) {
  const label = typeLabels[type] || 'Content';
  const colorClass = typeColors[type] || typeColors.BLOG_LAYOUT;

  return (
    <div className="border border-border rounded-xl overflow-hidden my-2">
      {/* Cover image */}
      {data.cover_image && (
        <img
          src={data.cover_image}
          alt={data.title}
          className="w-full h-32 object-cover"
        />
      )}

      {/* Header */}
      <div className="px-4 py-2.5 bg-muted border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
            {label}
          </span>
          {data.published ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Published
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              Draft
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-2">
        <h3 className="text-sm font-bold text-foreground">{data.title}</h3>

        {data.excerpt && (
          <p className="text-xs text-muted-foreground line-clamp-3">{data.excerpt}</p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
          {data.author && (
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {data.author}
            </div>
          )}
          {data.published_at && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(data.published_at).toLocaleDateString('en-IN')}
            </div>
          )}
        </div>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.tags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Social publish status */}
        {data.social_publish_status && Object.keys(data.social_publish_status).length > 0 && (
          <div className="border-t border-border pt-2">
            <div className="text-[10px] text-muted-foreground mb-1">Social Publish Status:</div>
            <div className="flex gap-2">
              {Object.entries(data.social_publish_status).map(([platform, status]) => (
                <span
                  key={platform}
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    status === 'published'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : status === 'failed'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}
                >
                  {platform}: {status}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SEO meta */}
        {data.meta_title && (
          <div className="text-[10px] text-muted-foreground border-t border-border pt-2">
            <div><strong>SEO Title:</strong> {data.meta_title}</div>
            {data.meta_description && <div><strong>Description:</strong> {data.meta_description}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
