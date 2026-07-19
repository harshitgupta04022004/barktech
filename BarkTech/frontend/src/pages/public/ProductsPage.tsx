import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Category { _id: string; name: string; slug: string; }
interface Product {
  _id: string;
  name: string;
  slug: string;
  summary?: string;
  shortDescription?: string;
  description?: string;
  categoryId?: Category;
  media?: { url: string; alt?: string }[];
}

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');

  const { data: categoriesData } = useQuery<{ success: boolean; data: Category[] }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/products/categories/all');
      return res.json();
    },
  });

  const categories = categoriesData?.data ?? [];
  const allCategories = [{ _id: 'all', name: 'All', slug: 'all' }, ...categories];

  const buildCategoryParam = (cat: string) => {
    if (cat === 'All') return '';
    const dbCat = categories.find(db => db.slug === cat || db.name === cat);
    if (dbCat) return `categoryId=${dbCat._id}`;
    return '';
  };

  const { data: productsData, isLoading } = useQuery<{ success: boolean; data: Product[]; meta: { total: number } }>({
    queryKey: ['products', activeCategory, search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (activeCategory !== 'All') {
        const catParam = buildCategoryParam(activeCategory);
        if (catParam) {
          const [key, value] = catParam.split('=');
          params.set(key, value);
        }
      }
      if (search) params.set('search', search);
      const res = await fetch(`/api/products?${params}`);
      return res.json();
    },
  });
  const products = productsData?.data ?? [];

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams(prev => {
        if (search) prev.set('q', search);
        else prev.delete('q');
        return prev;
      });
    }, 400);
    return () => clearTimeout(t);
  }, [search, setSearchParams]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-white">Our All Products</h1>
        <p className="mt-2 text-muted-foreground">We provide best products & solutions</p>
      </div>

      {/* Search & Filter */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allCategories.map((cat) => (
            <Button
              key={cat.slug || cat._id}
              variant={activeCategory === cat.name || activeCategory === cat.slug ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat.name)}
              className="whitespace-nowrap"
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Products count */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground mb-4">
          {products.length} product{products.length !== 1 ? 's' : ''} found
          {activeCategory !== 'All' && ` in "${activeCategory}"`}
        </p>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">Loading products...</div>
      ) : products.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link key={product._id} to={`/products/${product.slug}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full group bg-card text-card-foreground border-border">
                <div className="aspect-video bg-secondary flex items-center justify-center overflow-hidden">
                  {product.media && product.media[0] ? (
                    <img src={product.media[0].url} alt={product.media[0].alt || product.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-muted-foreground text-sm px-4 text-center">{product.name}</span>
                  )}
                </div>
                <CardContent className="p-5">
                  <span className="text-xs text-primary font-medium uppercase">{product.categoryId?.name || 'Product'}</span>
                  <h3 className="mt-1 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{product.name}</h3>
                  {product.shortDescription && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{product.shortDescription}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground">
          <Filter className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No products match your search criteria.</p>
        </div>
      )}
    </div>
  );
}
