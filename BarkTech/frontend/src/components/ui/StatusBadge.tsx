import { cn } from '@/lib/utils';

type InquiryStatus = 'new' | 'contacted' | 'qualified' | 'quoted' | 'won' | 'lost';
type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
type ProductStatus = 'active' | 'inactive' | 'draft' | 'published';
type InstallationStatus = 'completed' | 'in-progress' | 'upcoming';

type StatusVariant = InquiryStatus | InvoiceStatus | ProductStatus | InstallationStatus;

interface StatusBadgeProps {
  status: StatusVariant;
  className?: string;
}

const statusStyles: Record<string, string> = {
  // Inquiry statuses
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  contacted: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  qualified: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  quoted: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  won: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  // Invoice statuses
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  // Product statuses
  active: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  inactive: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  published: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  // Installation statuses
  'completed': 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  'in-progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  'upcoming': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = status
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        statusStyles[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        className
      )}
    >
      {label}
    </span>
  );
}
