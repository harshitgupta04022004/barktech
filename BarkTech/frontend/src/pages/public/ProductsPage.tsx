import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, ArrowRight, Package, ChevronRight } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-950">
      {/* ═══════ HERO SECTION ═══════ */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        {/* Ambient backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/[0.03] blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-20 sm:pb-16">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[12px] text-gray-500 mb-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-300">Products</span>
          </div>

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 mb-5">
              <Package className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Product Catalog
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-[1.1]">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">Products</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-400 leading-relaxed max-w-xl">
              Explore our complete range of machinery and packaging solutions.
              Built for performance, designed for reliability.
            </p>
          </div>

          {/* Stats strip */}
          <div className="mt-8 flex flex-wrap items-center gap-6 text-[13px]">
            <div className="flex items-center gap-2 text-gray-400">
              <div className="h-1 w-1 rounded-full bg-primary" />
              <span><span className="text-white font-semibold">{products.length || '—'}</span> Products</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="h-1 w-1 rounded-full bg-primary" />
              <span><span className="text-white font-semibold">{categories.length || '—'}</span> Categories</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="h-1 w-1 rounded-full bg-primary" />
              <span>Industrial Grade</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ FILTER BAR ═══════ */}
      <div className="sticky top-14 z-20 border-b border-white/[0.06] bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-[13px] text-white placeholder:text-gray-600 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none -mx-1 px-1">
              {allCategories.map((cat) => {
                const isActive = activeCategory === cat.name || activeCategory === cat.slug;
                return (
                  <button
                    key={cat.slug || cat._id}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition-all duration-200 border ${
                      isActive
                        ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                        : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:bg-white/[0.06] hover:text-gray-200 hover:border-white/[0.1]'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ PRODUCTS GRID ═══════ */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Count */}
        {!isLoading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-[13px] text-gray-500">
              Showing <span className="text-gray-300 font-medium">{products.length}</span> product{products.length !== 1 ? 's' : ''}
              {activeCategory !== 'All' && (
                <> in <span className="text-primary">{activeCategory}</span></>
              )}
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-white/[0.04]" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-20 rounded-full bg-white/[0.06]" />
                  <div className="h-5 w-3/4 rounded bg-white/[0.06]" />
                  <div className="h-3 w-full rounded bg-white/[0.04]" />
                  <div className="h-3 w-2/3 rounded bg-white/[0.04]" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link key={product._id} to={`/products/${product.slug}`} className="group block">
                <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-primary/[0.04] hover:-translate-y-1">
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-white/[0.03] to-white/[0.01] overflow-hidden">
                    {product.media && product.media[0] ? (
                      <img
                        src={product.media[0].url}
                        alt={product.media[0].alt || product.name}
                        className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-12 w-12 text-white/[0.08]" />
                      </div>
                    )}

                    {/* Category badge */}
                    {product.categoryId && (
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center rounded-lg bg-gray-950/80 backdrop-blur-sm border border-white/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-300">
                          {product.categoryId.name}
                        </span>
                      </div>
                    )}

                    {/* Hover arrow */}
                    <div className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 shadow-lg shadow-primary/30">
                      <ArrowRight className="h-4 w-4" />
                    </div>

                    {/* Bottom gradient */}
                    <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-gray-950/60 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-[15px] font-semibold text-white group-hover:text-primary transition-colors duration-200 leading-snug">
                      {product.name}
                    </h3>
                    {(product.shortDescription || product.summary) && (
                      <p className="mt-2 text-[13px] text-gray-500 leading-relaxed line-clamp-2">
                        {product.shortDescription || product.summary}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-1.5 text-[12px] font-medium text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      View Details
                      <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="py-24 text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
              <Filter className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No products found</h3>
            <p className="text-[14px] text-gray-500 max-w-sm mx-auto">
              {search
                ? `No results for "${search}". Try a different search term.`
                : 'No products match your current filters. Try selecting a different category.'}
            </p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('All'); }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-5 py-2.5 text-[13px] font-semibold text-primary hover:bg-primary/15 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
