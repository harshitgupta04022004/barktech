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
  description?: string;
  datasheetUrl?: string;
  categoryId?: { name: string };
  specs?: { key: string; value: string }[];
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
  return 'text-muted-foreground';
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
  const filteredProducts = search
    ? allProducts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.categoryId?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : allProducts;

  const handleDownload = (product: Product) => {
    if (product.datasheetUrl) {
      const link = document.createElement('a');
      link.href = product.datasheetUrl;
      link.download = `${product.name}-datasheet`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const specs = product.specs || [];
    const specRows = specs
      .map(s => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:500;color:#6b7280;width:40%">${s.key}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${s.value}</td></tr>`)
      .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${product.name} — Datasheet | Bark Technologies</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #1f2937; background: #fff; }
  .header { border-bottom: 3px solid #e65100; padding-bottom: 20px; margin-bottom: 30px; }
  .logo { font-size: 22px; font-weight: 700; color: #e65100; }
  .tagline { font-size: 12px; color: #9ca3af; }
  .product-name { font-size: 26px; font-weight: 700; margin: 0 0 6px; }
  .category { font-size: 13px; color: #e65100; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
  .description { font-size: 14px; color: #6b7280; line-height: 1.6; margin: 16px 0 24px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { background: #f9fafb; text-align: left; padding: 10px 12px; font-size: 13px; color: #374151; border-bottom: 2px solid #e5e7eb; }
  .specs-section h2 { font-size: 18px; margin: 30px 0 10px; color: #111827; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; display: flex; justify-content: space-between; }
  .contact-info { margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; font-size: 13px; }
  .contact-info strong { color: #e65100; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">BARK TECHNOLOGIES</div>
    <div class="tagline">Machinery & Packaging Solutions — Since 2019</div>
  </div>
  <div class="category">${product.categoryId?.name || 'Product'}</div>
  <h1 class="product-name">${product.name}</h1>
  ${product.shortDescription ? `<p class="description">${product.shortDescription}</p>` : ''}
  ${product.description ? `<p class="description">${product.description}</p>` : ''}
  ${specRows ? `
  <div class="specs-section">
    <h2>Specifications</h2>
    <table>
      <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
      <tbody>${specRows}</tbody>
    </table>
  </div>` : ''}
  <div class="contact-info">
    <strong>Contact Bark Technologies</strong><br>
    Phone: +91 8810597980 &nbsp;|&nbsp; Email: info@barktechnologies.in<br>
    Website: <a href="https://barktechnologies.in" style="color:#e65100;">barktechnologies.in</a>
  </div>
  <div class="footer">
    <span>UDYAM-UP-28-0004163 — Licensed Company</span>
    <span>Generated ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${product.name}-datasheet.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Product Datasheets</h1>
        <p className="mt-3 max-w-xl mx-auto text-muted-foreground">
          Download detailed product specifications, brochures, and technical documentation.
        </p>
      </div>

      {/* Search */}
      <div className="mb-8 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">Loading datasheets...</div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredProducts.map(product => (
            <Card key={product._id} className="hover:shadow-md transition-shadow border-border">
              <CardContent className="p-5 flex items-start gap-4">
                {/* Thumbnail */}
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
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
                  <h3 className="text-sm font-semibold text-foreground mt-0.5 truncate">{product.name}</h3>
                  {product.shortDescription && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{product.shortDescription}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      {product.datasheetUrl ? getFileType(product.datasheetUrl) : 'Auto-generated'}
                    </span>
                  </div>
                </div>

                {/* Download Button */}
                <button
                  onClick={() => handleDownload(product)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
                  title="Download datasheet"
                >
                  <Download className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground">
          <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No products found{search ? ' matching your search' : ''}.</p>
        </div>
      )}

      {/* Info Banner */}
      {filteredProducts.length > 0 && (
        <div className="mt-10 rounded-lg border border-border bg-muted p-4">
          <p className="text-sm text-muted-foreground text-center">
            Need more information?{' '}
            <a href="/contact" className="text-primary hover:underline font-medium">Contact our sales team</a>
            {' '}for detailed specifications and custom solutions.
          </p>
        </div>
      )}
    </div>
  );
}
