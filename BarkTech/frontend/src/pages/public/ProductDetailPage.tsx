import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId?: { name: string };
  specs: { key: string; value: string }[];
  media: { url: string; alt?: string }[];
  datasheetUrl?: string;
  moq?: number;
  leadTimeDays?: number;
  isActive: boolean;
}

export function ProductDetailPage() {
  const { slug } = useParams();

  const { data: productData, isLoading } = useQuery<{ success: boolean; data: Product }>({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await fetch(`/api/products/slug/${slug}`);
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    enabled: !!slug,
  });

  const product = productData?.data;

  const handleDownloadDatasheet = () => {
    if (!product) return;

    // If product has an uploaded datasheet file, download it directly
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

    // Otherwise, generate a clean HTML datasheet and trigger download
    const specRows = product.specs
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
  ${product.specs.length > 0 ? `
  <div class="specs-section">
    <h2>Specifications</h2>
    <table>
      <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
      <tbody>${specRows}</tbody>
    </table>
  </div>` : ''}
  ${product.moq ? `<p style="font-size:14px;color:#374151;"><strong>Minimum Order Quantity:</strong> ${product.moq} unit(s)</p>` : ''}
  ${product.leadTimeDays ? `<p style="font-size:14px;color:#374151;"><strong>Lead Time:</strong> ${product.leadTimeDays} day(s)</p>` : ''}
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

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-center text-muted-foreground">Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <Link to="/products">
          <Button variant="outline"><ArrowLeft className="h-4 w-4" /> Back to Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Product Image */}
        <div className="lg:col-span-2">
          <div className="aspect-[16/9] rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
            {product.media && product.media[0] ? (
              <img src={product.media[0].url} alt={product.media[0].alt || product.name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-gray-400 text-lg">{product.name}</span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <span className="text-sm text-primary font-medium uppercase">{product.categoryId?.name || 'Product'}</span>
          <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>
          {product.shortDescription && <p className="mt-4 text-muted-foreground">{product.shortDescription}</p>}
          <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>

          <div className="mt-6 flex gap-3">
            <Link to={`/inquiry?productId=${product._id}&productName=${encodeURIComponent(product.name)}`} className="flex-1">
              <Button className="w-full">
                <Send className="h-4 w-4" /> Get Price/Quote
              </Button>
            </Link>
            <Button variant="outline" onClick={handleDownloadDatasheet}>
              <Download className="h-4 w-4" /> Datasheet
            </Button>
          </div>
        </div>
      </div>

      {/* Specifications */}
      {product.specs.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {product.specs.map((spec, i) => (
                <div key={i} className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">{spec.key}</span>
                  <span className="font-medium text-right">{spec.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inquiry Form */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Request To Call Back</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget as HTMLFormElement);
            const payload = Object.fromEntries(formData.entries());
            await fetch('/api/leads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...payload,
                quantity: Number(payload.quantity) || 1,
                rfqItems: [{ productName: product.name, quantity: Number(payload.quantity) || 1, notes: payload.notes }],
              }),
            });
            alert('Inquiry submitted! Our team will contact you within 24 hours.');
            (e.currentTarget as HTMLFormElement).reset();
          }}>
            <Input name="contactName" placeholder="Your Name *" required />
            <Input name="email" placeholder="Email *" type="email" required />
            <Input name="phone" placeholder="Phone" />
            <Input name="company" placeholder="Company" />
            <Input name="quantity" placeholder="Quantity" type="number" min="1" defaultValue="1" />
            <Input name="country" placeholder="Country" />
            <div className="sm:col-span-2">
              <textarea
                name="notes"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Additional notes..."
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Submit Inquiry</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
