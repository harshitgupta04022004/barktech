import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, User, ArrowRight, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  category: string;
  author: string;
  date: string;
  tags: string[];
}

const BLOG_CATEGORIES = ['All', 'Industry Insights', 'Product Updates', 'How-To Guides', 'Company News'];

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'How Die Cutting Technology is Revolutionizing Packaging',
    slug: 'die-cutting-revolutionizing-packaging',
    excerpt: 'Explore how modern die cutting machines are transforming the packaging industry with precision, speed, and versatility.',
    content: '',
    featuredImage: '/images/products/Automatic-Die-Cutting-and-Creasing-Machine.png',
    category: 'Industry Insights',
    author: 'Bark Technologies Team',
    date: '2026-07-15',
    tags: ['die cutting', 'packaging', 'automation'],
  },
  {
    id: '2',
    title: 'Choosing the Right Flute Laminator for Your Business',
    slug: 'choosing-right-flute-laminator',
    excerpt: 'A comprehensive guide to selecting the perfect flute laminator machine based on your production needs, budget, and material types.',
    content: '',
    featuredImage: '/images/products/high-speed-automatic-flute-laminator.png',
    category: 'How-To Guides',
    author: 'Bark Technologies Team',
    date: '2026-07-10',
    tags: ['flute laminator', 'buying guide', 'machinery'],
  },
  {
    id: '3',
    title: 'Introducing Our New High-Speed Folder Gluer Machine',
    slug: 'new-high-speed-folder-gluer',
    excerpt: 'We are excited to announce the arrival of our latest high-speed automatic folder gluer machine, designed for maximum efficiency.',
    content: '',
    featuredImage: '/images/products/Automatic-folder-gluer.png',
    category: 'Product Updates',
    author: 'Bark Technologies Team',
    date: '2026-07-05',
    tags: ['folder gluer', 'new product', 'automation'],
  },
  {
    id: '4',
    title: 'Why Indian Packaging Industry is Growing at 15% CAGR',
    slug: 'indian-packaging-industry-growth',
    excerpt: 'India packaging industry is booming. Discover the key drivers behind this growth and how packaging machinery suppliers are adapting.',
    content: '',
    featuredImage: '/images/1.jpg',
    category: 'Industry Insights',
    author: 'Bark Technologies Team',
    date: '2026-06-28',
    tags: ['industry growth', 'india', 'packaging market'],
  },
  {
    id: '5',
    title: 'Complete Guide to Creasing Matrix Selection',
    slug: 'creasing-matrix-selection-guide',
    excerpt: 'Learn how to choose the right creasing matrix for your die cutting operations — from double groove to patching tape solutions.',
    content: '',
    featuredImage: '/images/matrix/main-banner.png',
    category: 'How-To Guides',
    author: 'Bark Technologies Team',
    date: '2026-06-20',
    tags: ['creasing matrix', 'die cutting', 'guide'],
  },
  {
    id: '6',
    title: 'Successful Installation: Semi-Automatic Die Cutter in Maharashtra',
    slug: 'installation-maharashtra-die-cutter',
    excerpt: 'See how we helped a leading packaging company in Maharashtra streamline their operations with our semi-automatic die cutting machine.',
    content: '',
    featuredImage: '/images/news-images/gujrat.png',
    category: 'Company News',
    author: 'Bark Technologies Team',
    date: '2026-06-15',
    tags: ['installation', 'case study', 'maharashtra'],
  },
];

const categoryColors: Record<string, string> = {
  'Industry Insights': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  'Product Updates': 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  'How-To Guides': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  'Company News': 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
};

export function BlogPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
      const matchesSearch =
        !search ||
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(search.toLowerCase()) ||
        post.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-black dark:text-white">Blog & Insights</h1>
        <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-400">
          Stay informed with the latest packaging industry insights, product updates, and expert guides from Bark Technologies.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {BLOG_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="whitespace-nowrap dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Posts count */}
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''} found
        {activeCategory !== 'All' && ` in "${activeCategory}"`}
      </p>

      {/* Blog Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <Link key={post.id} to={`/blog/${post.id}`}>
              <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[post.category] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                  >
                    {post.category}
                  </span>
                </div>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {post.author}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-black transition-colors group-hover:text-primary dark:text-white">
                    {post.title}
                  </h3>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-0.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="flex items-center gap-1 text-sm font-medium text-primary">
                      Read
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-500 dark:text-gray-400">
          <Search className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No articles match your search criteria.</p>
        </div>
      )}
    </div>
  );
}
