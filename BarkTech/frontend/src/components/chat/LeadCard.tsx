import { User, Mail, Phone, Tag, Calendar, ArrowRight } from 'lucide-react';

interface LeadCardData {
  lead_id: string;
  contact_name: string;
  email?: string;
  phone?: string;
  company?: string;
  product_interest?: string;
  source?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  notes?: string;
  created_at?: string;
  last_contact?: string;
  next_follow_up?: string;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  contacted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  qualified: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  proposal_sent: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  won: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
};

interface LeadCardProps {
  data: LeadCardData;
  onSendMessage?: (msg: string) => void;
}

export function LeadCard({ data, onSendMessage }: LeadCardProps) {
  const status = data.status || 'new';
  const priority = data.priority || 'medium';

  return (
    <div className="border border-purple-200 dark:border-purple-800 rounded-xl overflow-hidden my-2">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-purple-50 dark:bg-purple-950/30 border-b border-purple-200 dark:border-purple-800">
        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-purple-700 dark:text-purple-300 truncate">
            {data.contact_name}
          </div>
          {data.company && (
            <div className="text-[10px] text-muted-foreground truncate">{data.company}</div>
          )}
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColors[status] || statusColors.new}`}>
          {status.replace('_', ' ')}
        </span>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${priorityColors[priority] || priorityColors.medium}`}>
          {priority}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        {/* Contact info */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {data.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-foreground truncate">{data.email}</span>
            </div>
          )}
          {data.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-foreground">{data.phone}</span>
            </div>
          )}
          {data.product_interest && (
            <div className="flex items-center gap-1.5 col-span-2">
              <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-foreground">{data.product_interest}</span>
            </div>
          )}
          {data.source && (
            <div className="text-muted-foreground">
              Source: <span className="text-foreground">{data.source}</span>
            </div>
          )}
          {data.assigned_to && (
            <div className="text-muted-foreground">
              Assigned: <span className="text-foreground">{data.assigned_to}</span>
            </div>
          )}
        </div>

        {/* Dates */}
        {(data.created_at || data.next_follow_up) && (
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground border-t border-border pt-2">
            {data.created_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created: {new Date(data.created_at).toLocaleDateString('en-IN')}
              </div>
            )}
            {data.next_follow_up && (
              <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                <ArrowRight className="h-3 w-3" />
                Follow up: {new Date(data.next_follow_up).toLocaleDateString('en-IN')}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {data.notes && (
          <div className="text-xs text-muted-foreground border-t border-border pt-2">
            <span className="font-medium">Notes:</span> {data.notes}
          </div>
        )}

        {/* Actions */}
        {onSendMessage && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onSendMessage(`Contact lead ${data.contact_name} about ${data.product_interest || 'their inquiry'}`)}
              className="px-3 py-1.5 text-[10px] font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Contact
            </button>
            <button
              onClick={() => onSendMessage(`View lead ${data.lead_id} details`)}
              className="px-3 py-1.5 text-[10px] font-medium border border-border rounded-lg hover:bg-accent transition-colors"
            >
              View Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
