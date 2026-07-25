import { Calendar, Clock, MapPin, Users, ExternalLink } from 'lucide-react';

interface CalendarEventData {
  event_id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  location?: string;
  attendees?: string[];
  event_type?: string;
  customer_name?: string;
  customer_email?: string;
  status?: string;
  google_calendar_link?: string;
}

const eventTypeColors: Record<string, string> = {
  demo: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  installation: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  site_visit: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  meeting: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};

interface CalendarEventCardProps {
  data: CalendarEventData;
}

export function CalendarEventCard({ data }: CalendarEventCardProps) {
  const typeColor = eventTypeColors[data.event_type || ''] || eventTypeColors.meeting;

  return (
    <div className="border border-border rounded-xl overflow-hidden my-2">
      <div className="px-4 py-2.5 bg-muted border-b border-border">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-bold text-foreground">Calendar Event</span>
          {data.event_type && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeColor}`}>
              {data.event_type.replace('_', ' ')}
            </span>
          )}
          {data.status && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ml-auto ${
              data.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
              data.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
            }`}>
              {data.status}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        <div className="text-sm font-medium text-foreground">{data.title}</div>

        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span>
              {new Date(data.start_time).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
              {data.end_time && (
                <> - {new Date(data.end_time).toLocaleTimeString('en-IN', {
                  hour: '2-digit', minute: '2-digit',
                })}</>
              )}
            </span>
          </div>

          {data.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>{data.location}</span>
            </div>
          )}

          {data.customer_name && (
            <div className="text-muted-foreground">
              Customer: <span className="text-foreground">{data.customer_name}</span>
              {data.customer_email && <span className="text-muted-foreground"> ({data.customer_email})</span>}
            </div>
          )}

          {data.attendees && data.attendees.length > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-3 w-3 shrink-0" />
              <span>{data.attendees.join(', ')}</span>
            </div>
          )}
        </div>

        {data.description && (
          <div className="text-xs text-muted-foreground border-t border-border pt-2">
            {data.description}
          </div>
        )}

        {data.google_calendar_link && (
          <a
            href={data.google_calendar_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#e65100] hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Open in Google Calendar
          </a>
        )}
      </div>
    </div>
  );
}
