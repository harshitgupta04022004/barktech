import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Zap, Shield, Globe, Wrench, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  { icon: Zap, title: 'High Performance', desc: 'Machines engineered for maximum throughput and reliability.' },
  { icon: Shield, title: 'Quality Assured', desc: 'Licensed company (UDYAM-UP-28-0004163) with 1-year warranty on all machines.' },
  { icon: Globe, title: 'Nationwide Presence', desc: '100+ machines installed across Ahmedabad, Noida, Pune, Chennai, Bengaluru and more.' },
  { icon: Wrench, title: 'Expert Support', desc: 'Skilled team for installation, maintenance, and machine repair services.' },
];

interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  categoryId?: { name: string };
  media?: { url: string; alt?: string }[];
}

export function HomePage() {
  const { data: productsData } = useQuery<{ success: boolean; data: Product[] }>({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const res = await fetch('/api/products?limit=4');
      return res.json();
    },
  });

  const products = productsData?.data ?? [];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-primary/20 text-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Emerging & Growing Company in <span className="text-primary">Post Press Equipment Solutions</span>
            </h1>
            <p className="mt-6 text-lg text-gray-300">
              Bark Technologies provides innovative and high-quality packaging machines and solutions
              across India. We control a high quality service in India as well as neighbouring countries with trust since 2019.
            </p>
            <div className="mt-8 flex gap-4">
              <Link to="/products">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Explore Products <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="tel:+918810597980">
                <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-white/10">
                  <Phone className="h-4 w-4" /> +91 8810597980
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Why Choose Us</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">100% Client Satisfaction is the main object for us</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title} className="text-center p-6 hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{f.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold">Our Awesome Products</h2>
              <p className="mt-2 text-muted-foreground">We provide best products & solutions</p>
            </div>
            <Link to="/products">
              <Button variant="outline">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => (
                <Link key={p._id} to={`/products/${p.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                      {p.media && p.media[0] ? (
                        <img src={p.media[0].url} alt={p.media[0].alt || p.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-gray-400 text-sm px-4 text-center">{p.name}</span>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <span className="text-xs text-primary font-medium uppercase">{p.categoryId?.name || 'Product'}</span>
                      <h3 className="mt-1 font-semibold group-hover:text-primary transition-colors line-clamp-2">{p.name}</h3>
                      {p.shortDescription && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.shortDescription}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">Loading products...</div>
            )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">We Control A High Quality Service In India As Well As Neighbouring Countries With Trust Since 2019</h2>
          <p className="mt-4 text-lg text-white/80">Get a free quote today. Call us at +91 8810597980</p>
          <Link to="/contact" className="mt-8 inline-block">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              Get a Free Quote
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
