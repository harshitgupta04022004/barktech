import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Category { _id: string; name: string; slug: string; description?: string; }
interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  categoryId?: Category;
  media?: { url: string; alt?: string }[];
}

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');

  const { data: categoriesData } = useQuery<{ success: boolean; data: Category[] }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/products/categories/all');
      return res.json();
    },
  });

  const dbCategories = categoriesData?.data ?? [];
  const currentCategory = dbCategories.find(c => c.slug === slug || c.name === slug);

  const buildCategoryParam = () => {
    if (!currentCategory) return '';
    return `categoryId=${currentCategory._id}`;
  };

  const { data: productsData, isLoading } = useQuery<{ success: boolean; data: Product[]; meta: { total: number } }>({
    queryKey: ['products', slug, search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      const catParam = buildCategoryParam();
      if (catParam) {
        const [key, value] = catParam.split('=');
        params.set(key, value);
      }
      if (search) params.set('search', search);
      const res = await fetch(`/api/products?${params}`);
      return res.json();
    },
    enabled: !!currentCategory,
  });
  const products = productsData?.data ?? [];

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

  const displayName = currentCategory?.name || slug?.replace(/-/g, ' ') || 'Category';

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back Link */}
      <Link to="/products" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" />
        All Products
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold capitalize text-black dark:text-white">{displayName}</h1>
        {currentCategory?.description && (
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl">{currentCategory.description}</p>
        )}
        {!currentCategory && !isLoading && (
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Browse our {displayName} product collection.
          </p>
        )}
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Search in ${displayName}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Products count */}
      {!isLoading && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {products.length} product{products.length !== 1 ? 's' : ''} found in {displayName}
        </p>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-gray-500 dark:text-gray-400">Loading products...</div>
      ) : products.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(product => (
            <Link key={product._id} to={`/products/${product.slug}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full group dark:bg-gray-900 dark:border-gray-800">
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  {product.media && product.media[0] ? (
                    <img src={product.media[0].url} alt={product.media[0].alt || product.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm px-4 text-center">{product.name}</span>
                  )}
                </div>
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold text-black group-hover:text-primary transition-colors dark:text-white">{product.name}</h3>
                  {product.shortDescription && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{product.shortDescription}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-500 dark:text-gray-400">
          <Filter className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No products found in this category.</p>
          <Link to="/products">
            <Button variant="outline" className="mt-4" size="sm">Browse All Products</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
