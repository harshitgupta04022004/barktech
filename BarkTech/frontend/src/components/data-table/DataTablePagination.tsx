import { type Table } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalRows = table.getFilteredRowModel().rows.length;
  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);
  const totalPages = table.getPageCount();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
            table.setPageIndex(0);
          }}
          className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {from} to {to} of {totalRows} entries
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Page {pageIndex + 1} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
