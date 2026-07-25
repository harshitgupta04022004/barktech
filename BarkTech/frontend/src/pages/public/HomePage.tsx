import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Zap, Shield, Globe, Wrench, Phone, ChevronRight, Award, Clock, HeadphonesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LiveShowcase } from '@/components/showcase/LiveShowcase';

const features = [
  { icon: Zap, title: 'High Performance', desc: 'Machines engineered for maximum throughput and uncompromising reliability across every production cycle.', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: Shield, title: 'Quality Assured', desc: 'Licensed (UDYAM-UP-28-0004163) with comprehensive 1-year warranty on all machinery and components.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: Globe, title: 'Nationwide Presence', desc: '100+ machines installed across major industrial hubs — Ahmedabad, Noida, Pune, Chennai, Bengaluru & more.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: Wrench, title: 'Expert Support', desc: 'Dedicated team for professional installation, preventive maintenance, and rapid machine repair services.', color: 'text-violet-500', bg: 'bg-violet-500/10' },
];

const stats = [
  { value: '100+', label: 'Machines Installed', icon: Award },
  { value: '2019', label: 'Established', icon: Clock },
  { value: '15+', label: 'Cities Covered', icon: Globe },
  { value: '24/7', label: 'Support Available', icon: HeadphonesIcon },
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
    queryKey: ['featured-products-home'],
    queryFn: async () => {
      const res = await fetch('/api/products?limit=8');
      return res.json();
    },
  });

  const products = productsData?.data ?? [];

  return (
    <div>
      {/* ═══════════════════════════════════════════ HERO ═══════════════════════════════════════════ */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gray-950">
        {/* Ambient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-primary/5" />
          <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-1/4 right-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '48px 48px',
          }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8 w-full">
          <div className="max-w-4xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Machinery & Packaging Solutions</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl leading-[1.08]">
              Emerging &{' '}
              <span className="relative">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-orange-400">Growing</span>
              </span>
              <br className="hidden sm:block" />
              Company in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Post Press</span>
              <br />
              Equipment Solutions
            </h1>

            {/* Sub-headline */}
            <p className="mt-7 max-w-2xl text-base sm:text-lg leading-relaxed text-gray-400">
              Innovative, high-quality packaging machines and solutions across India.
              We deliver trusted service and engineering excellence to businesses across India and neighbouring countries since 2019.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/products">
                <Button size="lg" className="h-12 px-7 text-[15px] font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5">
                  Explore Products
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link to="/inquiry">
                <Button size="lg" variant="outline" className="h-12 px-7 text-[15px] font-semibold border-gray-700 text-white hover:bg-white/10 hover:border-gray-600 transition-all duration-300">
                  Get a Free Quote
                </Button>
              </Link>
              <a href="tel:+918810597980">
                <Button size="lg" variant="ghost" className="h-12 px-5 text-[15px] text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300">
                  <Phone className="h-4 w-4 mr-1.5" />
                  +91 8810597980
                </Button>
              </a>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-4 backdrop-blur-sm hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white tracking-tight">{stat.value}</div>
                  <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ WHY CHOOSE US ═══════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4">Why Choose Us</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Built for Performance.<br className="hidden sm:block" /> Designed for Trust.
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              100% client satisfaction is the core of everything we build and deliver.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title} className="group relative overflow-hidden border-border hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                <CardContent className="p-6 pt-6">
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${f.bg} ${f.color} transition-transform duration-300 group-hover:scale-110`}>
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-[15px] font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ FEATURED PRODUCTS ═══════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4">Our Products</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                Featured Equipment
              </h2>
              <p className="mt-3 text-muted-foreground max-w-md">
                Explore our best-in-class machinery designed for precision and durability.
              </p>
            </div>
            <Link to="/products" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group">
              View All
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.slice(0, 4).map((p) => (
                <Link key={p._id} to={`/products/${p.slug}`}>
                  <Card className="group overflow-hidden border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-500 h-full">
                    <div className="relative aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
                      {p.media && p.media[0] ? (
                        <img
                          src={p.media[0].url}
                          alt={p.media[0].alt || p.name}
                          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-700 ease-out"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm px-4 text-center">{p.name}</span>
                      )}
                    </div>
                    <CardContent className="p-5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary">{p.categoryId?.name || 'Product'}</span>
                      <h3 className="mt-1.5 text-[15px] font-bold text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
                        {p.name}
                      </h3>
                      {p.shortDescription && (
                        <p className="mt-2 text-[13px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {p.shortDescription}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground">Loading products...</div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link to="/products">
              <Button variant="outline" className="gap-1.5">
                View All Products <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ LIVE SHOWCASE ═══════════════════════════════════════════ */}
      <LiveShowcase />

      {/* ═══════════════════════════════════════════ CTA ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-orange-600 py-20 sm:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-snug">
            Trusted Engineering Excellence<br className="hidden sm:block" /> Across India & Beyond — Since 2019
          </h2>
          <p className="mt-5 text-lg text-white/80 max-w-2xl mx-auto">
            Get a free consultation or quote for your next packaging machinery project.
            Our team is ready to help.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/inquiry">
              <Button size="lg" className="h-12 px-8 text-[15px] font-semibold bg-white text-primary hover:bg-white/90 shadow-xl shadow-black/10 transition-all duration-300 hover:-translate-y-0.5">
                Get a Free Quote
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <a href="tel:+918810597980">
              <Button size="lg" variant="outline" className="h-12 px-8 text-[15px] font-semibold border-white/30 text-white hover:bg-white/10 transition-all duration-300">
                <Phone className="h-4 w-4 mr-1.5" />
                Call Us Now
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
