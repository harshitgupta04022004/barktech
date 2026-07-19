import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { type Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return (
      <div className={cn('text-sm font-medium text-gray-900 dark:text-white', className)}>
        {title}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-gray-100 dark:data-[state=open]:bg-gray-800"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <span className="text-sm font-medium text-gray-900 dark:text-white">{title}</span>
        {column.getIsSorted() === 'desc' ? (
          <ArrowDown className="ml-2 h-4 w-4 text-gray-600 dark:text-gray-400" />
        ) : column.getIsSorted() === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
        )}
      </Button>
    </div>
  );
}
