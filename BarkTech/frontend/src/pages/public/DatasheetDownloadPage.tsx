import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  datasheetUrl?: string;
  categoryId?: { name: string };
  media?: { url: string; alt?: string }[];
}

const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF Document',
  doc: 'Word Document',
  docx: 'Word Document',
  xls: 'Excel Spreadsheet',
  xlsx: 'Excel Spreadsheet',
  ppt: 'PowerPoint',
  pptx: 'PowerPoint',
};

function getFileType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  return FILE_TYPE_LABELS[ext] || ext.toUpperCase() || 'File';
}

function getFileIconClass(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'text-red-500';
  if (ext.startsWith('xls')) return 'text-green-600';
  if (ext.startsWith('doc')) return 'text-blue-500';
  return 'text-gray-500';
}

export function DatasheetDownloadPage() {
  const [search, setSearch] = useState('');

  const { data: productsData, isLoading } = useQuery<{ success: boolean; data: Product[] }>({
    queryKey: ['products-datasheets'],
    queryFn: async () => {
      const res = await fetch('/api/products?limit=200');
      return res.json();
    },
  });

  const allProducts = productsData?.data ?? [];
  const products = allProducts.filter(p => p.datasheetUrl);
  const filteredProducts = search
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.categoryId?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-black dark:text-white">Product Datasheets</h1>
        <p className="mt-3 max-w-xl mx-auto text-gray-600 dark:text-gray-400">
          Download detailed product specifications, brochures, and technical documentation.
        </p>
      </div>

      {/* Search */}
      <div className="mb-8 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-gray-500 dark:text-gray-400">Loading datasheets...</div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredProducts.map(product => (
            <Card key={product._id} className="hover:shadow-md transition-shadow dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-5 flex items-start gap-4">
                {/* Thumbnail */}
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  {product.media && product.media[0] ? (
                    <img src={product.media[0].url} alt={product.name} className="h-full w-full object-contain" />
                  ) : (
                    <FileText className={cn('h-6 w-6', getFileIconClass(product.datasheetUrl || ''))} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {product.categoryId?.name && (
                    <span className="text-xs font-medium text-primary uppercase">{product.categoryId.name}</span>
                  )}
                  <h3 className="text-sm font-semibold text-black dark:text-white mt-0.5 truncate">{product.name}</h3>
                  {product.shortDescription && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{product.shortDescription}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      <FileText className="h-3 w-3" />
                      {getFileType(product.datasheetUrl || '')}
                    </span>
                  </div>
                </div>

                {/* Download Button */}
                <a
                  href={product.datasheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
                  title="Download datasheet"
                >
                  <Download className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-500 dark:text-gray-400">
          <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No datasheets available{search ? ' matching your search' : ''}.</p>
          {!search && (
            <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
              Datasheets will appear here once uploaded by the admin.
            </p>
          )}
        </div>
      )}

      {/* Info Banner */}
      {filteredProducts.length > 0 && (
        <div className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Need more information?{' '}
            <a href="/contact" className="text-primary hover:underline font-medium">Contact our sales team</a>
            {' '}for detailed specifications and custom solutions.
          </p>
        </div>
      )}
    </div>
  );
}
