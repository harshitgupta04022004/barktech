import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table';
import { Search, Download, Settings2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableColumnHeader } from './DataTableColumnHeader';
import { DataTablePagination } from './DataTablePagination';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  searchPlaceholder?: string;
  searchKey?: string;
  serverSidePagination?: boolean;
  pageCount?: number;
  onPaginationChange?: (pagination: PaginationState) => void;
  onExportCSV?: (rows: TData[]) => void;
  pageSize?: number;
}

export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  searchKey = 'name',
  serverSidePagination = false,
  pageCount,
  onPaginationChange,
  onExportCSV,
  pageSize: initialPageSize = 10,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const table = useReactTable({
    data,
    columns,
    pageCount: serverSidePagination ? pageCount : undefined,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
      setPagination(newPagination);
      onPaginationChange?.(newPagination);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: serverSidePagination ? undefined : getPaginationRowModel(),
    globalFilterFn: 'includesString',
  });

  const handleExport = () => {
    if (onExportCSV) {
      const selectedRows = table.getFilteredSelectedRowModel().rows;
      const rows =
        selectedRows.length > 0
          ? selectedRows.map((r) => r.original)
          : table.getFilteredRowModel().rows.map((r) => r.original);
      onExportCSV(rows);
      return;
    }

    const rows = table.getFilteredRowModel().rows;
    if (rows.length === 0) return;

    const headers = columns
      .filter((col) => typeof col.header === 'string')
      .map((col) => col.header as string);

    const accessorKeys = columns
      .filter((col) => 'accessorKey' in col)
      .map((col) => (col as { accessorKey: string }).accessorKey);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        accessorKeys
          .map((key) => {
            const val = row.original[key as keyof typeof row.original];
            const str = val == null ? '' : String(val);
            return str.includes(',') ? `"${str}"` : str;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? globalFilter}
            onChange={(e) => {
              const val = e.target.value;
              if (searchKey && table.getColumn(searchKey)) {
                table.getColumn(searchKey)?.setFilterValue(val);
              } else {
                setGlobalFilter(val);
              }
            }}
            className="pl-9 dark:bg-gray-800 dark:border-gray-600"
          />
          {((searchKey && table.getColumn(searchKey)?.getFilterValue()) || globalFilter) && (
            <button
              onClick={() => {
                if (searchKey && table.getColumn(searchKey)) {
                  table.getColumn(searchKey)?.setFilterValue('');
                } else {
                  setGlobalFilter('');
                }
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={() => setShowColumnSettings(!showColumnSettings)}
            >
              <Settings2 className="h-4 w-4" />
              Columns
            </Button>
            {showColumnSettings && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Toggle Columns
                </p>
                {table
                  .getAllLeafColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== 'undefined' && column.id !== 'select'
                  )
                  .map((column) => (
                    <label
                      key={column.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={(e) => column.toggleVisibility(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      {column.id}
                    </label>
                  ))}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Selection info */}
      {Object.keys(rowSelection).length > 0 && (
        <div className="flex items-center gap-2 text-sm text-primary">
          <span>{Object.keys(rowSelection).length} row(s) selected</span>
          <button
            onClick={() => setRowSelection({})}
            className="text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b border-gray-200 dark:border-gray-800"
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="whitespace-nowrap bg-gray-50 px-4 py-3 text-left font-medium text-gray-500 dark:bg-gray-800/50 dark:text-gray-400"
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <DataTableColumnHeader
                            column={header.column}
                            title={String(
                              header.column.columnDef.header ?? header.id
                            )}
                          />
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="h-24 text-center text-gray-500 dark:text-gray-400"
                    >
                      No results found.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 transition-colors hover:bg-gray-50/50 dark:border-gray-800/50 dark:hover:bg-gray-800/30"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {table.getPageCount() > 1 && <DataTablePagination table={table} />}
    </div>
  );
}
