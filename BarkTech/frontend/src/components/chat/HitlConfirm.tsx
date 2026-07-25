import { AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react';

interface HitlConfirmData {
  action: string;
  description: string;
  entity_type?: string;
  entity_id?: string;
  risk_level?: string;
  requires_approval?: boolean;
}

interface HitlConfirmProps {
  data: HitlConfirmData;
  onSendMessage?: (msg: string) => void;
}

const riskColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800',
};

export function HitlConfirm({ data, onSendMessage }: HitlConfirmProps) {
  const risk = data.risk_level || 'medium';
  const colorClass = riskColors[risk] || riskColors.medium;

  return (
    <div className={`border rounded-xl overflow-hidden my-2 ${colorClass.split(' ').slice(2).join(' ')}`}>
      <div className={`px-4 py-2.5 border-b ${colorClass.split(' ').slice(2).join(' ')}`}>
        <div className="flex items-center gap-2">
          {risk === 'high' ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : (
            <Shield className="h-4 w-4 shrink-0" />
          )}
          <span className="text-sm font-bold">Approval Required</span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colorClass.split(' ').slice(0, 2).join(' ')}`}>
            {risk} risk
          </span>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        <div className="text-xs font-medium text-foreground">
          Action: {data.action.replace(/_/g, ' ')}
        </div>
        <div className="text-xs text-muted-foreground">{data.description}</div>

        {data.entity_type && (
          <div className="text-[10px] text-muted-foreground">
            Target: {data.entity_type} {data.entity_id && `(ID: ${data.entity_id})`}
          </div>
        )}

        {data.requires_approval && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onSendMessage?.(`APPROVE: ${data.action}:${data.entity_type}:${data.entity_id}`)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="h-3 w-3" />
              Approve
            </button>
            <button
              onClick={() => onSendMessage?.(`REJECT: ${data.action}:${data.entity_type}:${data.entity_id}`)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-accent transition-colors"
            >
              <XCircle className="h-3 w-3" />
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
