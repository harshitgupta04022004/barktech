import { TableView } from './TableView';
import { StatsChart } from './StatsChart';
import { LeadCard } from './LeadCard';
import { EmailPreview } from './EmailPreview';
import { BlogPreview } from './BlogPreview';
import { CalendarEventCard } from './CalendarEventCard';
import { HitlConfirm } from './HitlConfirm';

export interface StructuredBlock {
  type: string;
  payload: Record<string, any>;
  textBefore: string;
  textAfter: string;
  start: number;
  end: number;
}

// All known XML tags that agents can produce
const TAG_PATTERNS: { tag: string; regex: RegExp }[] = [
  { tag: 'PRODUCT_CARD', regex: /<PRODUCT_CARD>\s*(\{[\s\S]*?\})\s*<\/PRODUCT_CARD>/ },
  { tag: 'PRODUCT_LIST', regex: /<PRODUCT_LIST>\s*(\{[\s\S]*?\})\s*<\/PRODUCT_LIST>/ },
  { tag: 'INVOICE_CARD', regex: /<INVOICE_CARD>\s*(\{[\s\S]*?\})\s*<\/INVOICE_CARD>/ },
  { tag: 'INVOICE_LIST', regex: /<INVOICE_LIST>\s*(\{[\s\S]*?\})\s*<\/INVOICE_LIST>/ },
  { tag: 'EMAIL_LAYOUT', regex: /<EMAIL_LAYOUT>\s*(\{[\s\S]*?\})\s*<\/EMAIL_LAYOUT>/ },
  { tag: 'BLOG_LAYOUT', regex: /<BLOG_LAYOUT>\s*(\{[\s\S]*?\})\s*<\/BLOG_LAYOUT>/ },
  { tag: 'NEWS_LAYOUT', regex: /<NEWS_LAYOUT>\s*(\{[\s\S]*?\})\s*<\/NEWS_LAYOUT>/ },
  { tag: 'CASE_STUDY_LAYOUT', regex: /<CASE_STUDY_LAYOUT>\s*(\{[\s\S]*?\})\s*<\/CASE_STUDY_LAYOUT>/ },
  { tag: 'LEAD_CARD', regex: /<LEAD_CARD>\s*(\{[\s\S]*?\})\s*<\/LEAD_CARD>/ },
  { tag: 'LEAD_LIST', regex: /<LEAD_LIST>\s*(\{[\s\S]*?\})\s*<\/LEAD_LIST>/ },
  { tag: 'STOCK_ALERT', regex: /<STOCK_ALERT>\s*(\{[\s\S]*?\})\s*<\/STOCK_ALERT>/ },
  { tag: 'TABLE_VIEW', regex: /<TABLE_VIEW>\s*(\{[\s\S]*?\})\s*<\/TABLE_VIEW>/ },
  { tag: 'STATS_CHART', regex: /<STATS_CHART>\s*(\{[\s\S]*?\})\s*<\/STATS_CHART>/ },
  { tag: 'CALENDAR_EVENT', regex: /<CALENDAR_EVENT>\s*(\{[\s\S]*?\})\s*<\/CALENDAR_EVENT>/ },
  { tag: 'WHATSAPP_CONFIRM', regex: /<WHATSAPP_CONFIRM>\s*(\{[\s\S]*?\})\s*<\/WHATSAPP_CONFIRM>/ },
  { tag: 'DELETE_CONFIRM', regex: /<DELETE_CONFIRM>\s*(\{[\s\S]*?\})\s*<\/DELETE_CONFIRM>/ },
  { tag: 'HITL_CONFIRM', regex: /<HITL_CONFIRM>\s*(\{[\s\S]*?\})\s*<\/HITL_CONFIRM>/ },
  // MULTI_RESULT uses a different pattern - it contains nested XML tags, not JSON
  { tag: 'MULTI_RESULT', regex: /<MULTI_RESULT>([\s\S]*?)<\/MULTI_RESULT>/ },
];

/**
 * Parse all structured XML tags from agent response content.
 * Returns an array of blocks in order of appearance.
 */
export function parseStructuredContent(content: string): StructuredBlock[] {
  const blocks: StructuredBlock[] = [];

  for (const { tag, regex } of TAG_PATTERNS) {
    let match: RegExpExecArray | null;
    // Reset lastIndex for global regex
    regex.lastIndex = 0;
    while ((match = regex.exec(content)) !== null) {
      if (match.index === undefined) continue;
      try {
        let payload: Record<string, any>;

        // MULTI_RESULT contains nested XML, not JSON
        if (tag === 'MULTI_RESULT') {
          // Extract nested blocks from MULTI_RESULT content
          payload = { raw: match[1].trim() };
        } else {
          payload = JSON.parse(match[1]);
        }

        blocks.push({
          type: tag,
          payload,
          textBefore: content.substring(0, match.index).trim(),
          textAfter: content.substring(match.index + match[0].length).trim(),
          start: match.index,
          end: match.index + match[0].length,
        });
      } catch {
        // Skip invalid JSON
      }
    }
  }

  // Sort by start position
  blocks.sort((a, b) => a.start - b.start);
  return blocks;
}

interface StructuredResponseProps {
  content: string;
  onSendMessage?: (msg: string) => void;
  MarkdownRenderer: React.ComponentType<{ children: string }>;
}

/**
 * Unified structured response renderer.
 * Detects XML tags in agent output and renders the appropriate component.
 */
export function StructuredResponse({ content, onSendMessage, MarkdownRenderer }: StructuredResponseProps) {
  const blocks = parseStructuredContent(content);

  if (blocks.length === 0) {
    // No structured tags found, render as plain markdown
    return <MarkdownRenderer>{content}</MarkdownRenderer>;
  }

  // Render blocks with text before/after each
  return (
    <div className="space-y-3">
      {blocks.map((block, index) => (
        <div key={index}>
          {/* Text before this block */}
          {block.textBefore && (
            <MarkdownRenderer>{block.textBefore}</MarkdownRenderer>
          )}

          {/* The structured component */}
          <StructuredBlockRenderer
            type={block.type}
            payload={block.payload}
            onSendMessage={onSendMessage}
          />

          {/* Text after this block (only show for last block) */}
          {index === blocks.length - 1 && block.textAfter && (
            <MarkdownRenderer>{block.textAfter}</MarkdownRenderer>
          )}
        </div>
      ))}
    </div>
  );
}

interface StructuredBlockRendererProps {
  type: string;
  payload: Record<string, any>;
  onSendMessage?: (msg: string) => void;
}

/**
 * Render a single structured block based on its type.
 */
function StructuredBlockRenderer({ type, payload, onSendMessage }: StructuredBlockRendererProps) {
  switch (type) {
    case 'TABLE_VIEW':
      return <TableView data={payload as any} />;
    case 'STATS_CHART':
      return <StatsChart data={payload as any} />;
    case 'LEAD_CARD':
      return <LeadCard data={payload as any} onSendMessage={onSendMessage} />;
    case 'LEAD_LIST':
      return <LeadListCard data={payload} />;
    case 'EMAIL_LAYOUT':
      return <EmailPreview data={payload as any} />;
    case 'BLOG_LAYOUT':
    case 'NEWS_LAYOUT':
    case 'CASE_STUDY_LAYOUT':
      return <BlogPreview data={payload as any} type={type} />;
    case 'CALENDAR_EVENT':
      return <CalendarEventCard data={payload as any} />;
    case 'HITL_CONFIRM':
      return <HitlConfirm data={payload as any} onSendMessage={onSendMessage} />;
    case 'DELETE_CONFIRM':
      return <DeleteConfirmCard data={payload} onSendMessage={onSendMessage} />;
    case 'WHATSAPP_CONFIRM':
      return <WhatsAppConfirmCard data={payload} />;
    case 'PRODUCT_CARD':
    case 'PRODUCT_LIST':
    case 'INVOICE_CARD':
    case 'INVOICE_LIST':
    case 'STOCK_ALERT':
      // These are handled by existing ChatMessage.tsx parsers
      // for backward compatibility. New code should use the unified parser.
      return null;
    case 'MULTI_RESULT':
      return <MultiResultCard data={payload} onSendMessage={onSendMessage} />;
    default:
      return null;
  }
}

// ── Sub-components for less common types ──────────────

function LeadListCard({ data }: { data: Record<string, any> }) {
  const leads = data.leads || [];
  const total = data.total_count || leads.length;

  return (
    <div className="border border-purple-200 dark:border-purple-800 rounded-xl overflow-hidden my-2">
      <div className="px-4 py-2.5 bg-purple-50 dark:bg-purple-950/30 border-b border-purple-200 dark:border-purple-800">
        <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
          {total} Lead{total !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="divide-y divide-border">
        {leads.map((lead: Record<string, any>, i: number) => (
          <div key={i} className="px-4 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{lead.contact_name}</span>
              {lead.company && <span className="text-muted-foreground">at {lead.company}</span>}
              <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${
                lead.status === 'new' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                lead.status === 'qualified' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}>
                {lead.status}
              </span>
            </div>
            {lead.product_interest && (
              <div className="text-muted-foreground mt-0.5">Interest: {lead.product_interest}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DeleteConfirmCard({ data, onSendMessage }: { data: Record<string, any>; onSendMessage?: (msg: string) => void }) {
  return (
    <div className="border border-red-200 dark:border-red-800 rounded-xl overflow-hidden my-2 p-4">
      <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
        Confirm Deletion
      </div>
      <div className="text-xs text-muted-foreground mb-3">
        Are you sure you want to delete {data.entity_type} "{data.entity_name}"?
        {data.warning && <div className="mt-1 text-red-600">{data.warning}</div>}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSendMessage?.(`DELETE_CONFIRM: ${data.entity_type}:${data.entity_id}`)}
          className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Confirm Delete
        </button>
        <button
          onClick={() => onSendMessage?.('No, cancel the delete.')}
          className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function WhatsAppConfirmCard({ data }: { data: Record<string, any> }) {
  return (
    <div className="border border-green-200 dark:border-green-800 rounded-xl overflow-hidden my-2 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs">
          WA
        </div>
        <span className="text-sm font-medium text-green-700 dark:text-green-300">
          WhatsApp {data.status || 'Sent'}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        <div>To: {data.to}</div>
        {data.message && <div className="mt-1 p-2 bg-muted rounded text-foreground">{data.message}</div>}
        {data.timestamp && <div className="mt-1 text-[10px]">{data.timestamp}</div>}
      </div>
    </div>
  );
}

function MultiResultCard({ data, onSendMessage }: { data: Record<string, any>; onSendMessage?: (msg: string) => void }) {
  // MULTI_RESULT contains nested XML tags, parse them
  const rawContent = data.raw || '';

  // Extract nested blocks from the raw content
  const nestedBlocks: { type: string; payload: Record<string, any> }[] = [];
  const nestedPatterns = [
    { tag: 'INVOICE_CARD', regex: /<INVOICE_CARD>\s*(\{[\s\S]*?\})\s*<\/INVOICE_CARD>/ },
    { tag: 'EMAIL_LAYOUT', regex: /<EMAIL_LAYOUT>\s*(\{[\s\S]*?\})\s*<\/EMAIL_LAYOUT>/ },
    { tag: 'LEAD_CARD', regex: /<LEAD_CARD>\s*(\{[\s\S]*?\})\s*<\/LEAD_CARD>/ },
    { tag: 'PRODUCT_CARD', regex: /<PRODUCT_CARD>\s*(\{[\s\S]*?\})\s*<\/PRODUCT_CARD>/ },
    { tag: 'BLOG_LAYOUT', regex: /<BLOG_LAYOUT>\s*(\{[\s\S]*?\})\s*<\/BLOG_LAYOUT>/ },
    { tag: 'CALENDAR_EVENT', regex: /<CALENDAR_EVENT>\s*(\{[\s\S]*?\})\s*<\/CALENDAR_EVENT>/ },
    { tag: 'TABLE_VIEW', regex: /<TABLE_VIEW>\s*(\{[\s\S]*?\})\s*<\/TABLE_VIEW>/ },
  ];

  for (const { tag, regex } of nestedPatterns) {
    let match: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((match = regex.exec(rawContent)) !== null) {
      try {
        const payload = JSON.parse(match[1]);
        nestedBlocks.push({ type: tag, payload });
      } catch {
        // Skip invalid JSON
      }
    }
  }

  if (nestedBlocks.length === 0) {
    // Fallback: render raw content as markdown
    return <div className="text-sm text-muted-foreground">{rawContent}</div>;
  }

  return (
    <div className="space-y-3">
      {nestedBlocks.map((block, i) => (
        <div key={i}>
          <StructuredBlockRenderer
            type={block.type}
            payload={block.payload}
            onSendMessage={onSendMessage}
          />
        </div>
      ))}
    </div>
  );
}
