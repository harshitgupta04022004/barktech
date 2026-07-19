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
            <Link to="/contact" className="flex-1">
              <Button className="w-full">
                <Send className="h-4 w-4" /> Get Price/Quote
              </Button>
            </Link>
            <Button variant="outline">
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
