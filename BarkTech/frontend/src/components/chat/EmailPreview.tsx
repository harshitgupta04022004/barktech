import { Mail, Paperclip } from 'lucide-react';

interface EmailPreviewData {
  to: string;
  subject: string;
  preview_text?: string;
  body_html?: string;
  from_name?: string;
  from_email?: string;
  template_type?: string;
  attachments?: { name: string; size?: number }[];
  sent?: boolean;
  message_id?: string;
}

interface EmailPreviewProps {
  data: EmailPreviewData;
}

export function EmailPreview({ data }: EmailPreviewProps) {
  return (
    <div className="border border-border rounded-xl overflow-hidden my-2">
      {/* Email header */}
      <div className="px-4 py-2.5 bg-muted border-b border-border">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-bold text-foreground">Email Preview</span>
          {data.sent && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Sent
            </span>
          )}
          {data.template_type && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {data.template_type}
            </span>
          )}
        </div>
      </div>

      {/* Email metadata */}
      <div className="px-4 py-3 space-y-1.5 text-xs border-b border-border">
        <div className="flex gap-2">
          <span className="text-muted-foreground w-16 shrink-0">From:</span>
          <span className="text-foreground">
            {data.from_name || 'Bark Technologies'}
            {data.from_email && <span className="text-muted-foreground"> &lt;{data.from_email}&gt;</span>}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="text-muted-foreground w-16 shrink-0">To:</span>
          <span className="text-foreground">{data.to}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-muted-foreground w-16 shrink-0">Subject:</span>
          <span className="text-foreground font-medium">{data.subject}</span>
        </div>
        {data.preview_text && (
          <div className="flex gap-2">
            <span className="text-muted-foreground w-16 shrink-0">Preview:</span>
            <span className="text-muted-foreground italic">{data.preview_text}</span>
          </div>
        )}
      </div>

      {/* Email body */}
      {data.body_html && (
        <div className="px-4 py-3">
          <div className="text-[10px] text-muted-foreground mb-1">Email Body:</div>
          <div
            className="border border-border rounded-lg p-3 bg-white dark:bg-gray-950 text-xs max-h-64 overflow-y-auto prose prose-xs dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: data.body_html }}
          />
        </div>
      )}

      {/* Attachments */}
      {data.attachments && data.attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-border">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Paperclip className="h-3 w-3" />
            {data.attachments.length} attachment{data.attachments.length !== 1 ? 's' : ''}
          </div>
          <div className="mt-1 space-y-0.5">
            {data.attachments.map((att, i) => (
              <div key={i} className="text-[10px] text-foreground">
                {att.name}
                {att.size && <span className="text-muted-foreground ml-1">({(att.size / 1024).toFixed(1)}KB)</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message ID */}
      {data.message_id && (
        <div className="px-4 py-1.5 border-t border-border text-[10px] text-muted-foreground">
          Message ID: {data.message_id}
        </div>
      )}
    </div>
  );
}
