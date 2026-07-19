import { useState } from 'react';
import { Search, X, Calendar, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FilterState {
  search: string;
  dateFrom: string;
  dateTo: string;
  status: string;
}

interface StatusOption {
  label: string;
  value: string;
}

interface DataTableFilterProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  statusOptions?: StatusOption[];
  placeholder?: string;
  className?: string;
}

const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export function DataTableFilter({
  filters,
  onFilterChange,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  placeholder = 'Search...',
  className,
}: DataTableFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({ search: '', dateFrom: '', dateTo: '', status: '' });
  };

  const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.status;
  const totalActiveFilters = [filters.dateFrom, filters.dateTo, filters.status].filter(Boolean).length;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder={placeholder}
            value={filters.search}
            onChange={e => updateFilter('search', e.target.value)}
            className="pl-9 dark:bg-gray-800 dark:border-gray-600"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'gap-2 dark:border-gray-600 dark:text-gray-200',
            hasActiveFilters && 'border-primary text-primary'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {totalActiveFilters > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {totalActiveFilters}
            </span>
          )}
        </Button>

        {/* Clear All */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400">
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                From Date
              </label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={e => updateFilter('dateFrom', e.target.value)}
                className="text-sm dark:bg-gray-800 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                To Date
              </label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={e => updateFilter('dateTo', e.target.value)}
                className="text-sm dark:bg-gray-800 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">
                Status
              </label>
              <select
                value={filters.status}
                onChange={e => updateFilter('status', e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
