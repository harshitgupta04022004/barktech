import { Link } from 'react-router-dom';
import {
  Phone, ArrowRight, Box, Zap, Award, Layers,
  CheckCircle, Star, ChevronRight, Package, Truck, Target,
  Settings, RotateCcw, Wrench, CircleDot, Clock,
  HeartPulse, Wine, Printer, Crown,
} from 'lucide-react';

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */

const categories = [
  { name: 'PVC Matrix', desc: 'Durable PVC-based creasing matrix for standard folding carton applications', icon: Box, color: 'from-blue-500/20 to-blue-600/5', iconColor: 'text-blue-400' },
  { name: 'Fiber Matrix', desc: 'High-strength fiber matrix for heavy-duty corrugated board creasing', icon: Layers, color: 'from-emerald-500/20 to-emerald-600/5', iconColor: 'text-emerald-400' },
  { name: 'Plastic Matrix', desc: 'Versatile plastic matrix for precision die-cutting operations', icon: Settings, color: 'from-violet-500/20 to-violet-600/5', iconColor: 'text-violet-400' },
  { name: 'Adhesive Matrix', desc: 'Self-adhesive creasing matrix for quick and clean installation', icon: Zap, color: 'from-amber-500/20 to-amber-600/5', iconColor: 'text-amber-400' },
  { name: 'Rubber Accessories', desc: 'Premium ejection rubber strips for efficient waste removal', icon: CircleDot, color: 'from-rose-500/20 to-rose-600/5', iconColor: 'text-rose-400' },
  { name: 'Patching Materials', desc: 'Professional patching tape and blades for die board maintenance', icon: Wrench, color: 'from-cyan-500/20 to-cyan-600/5', iconColor: 'text-cyan-400' },
];

const matrixProducts = [
  {
    name: 'Creasing Matrix / Box',
    category: 'PVC Matrix',
    size: '70cm / 48pcs per box',
    image: '/images/matrix/creasing-matrix-1.png',
    description: 'Complete models support customization. High-quality creasing matrix for precision die cutting and creasing operations.',
    specs: { thickness: '0.5mm – 2.0mm', sizes: '40pt – 95pt', material: 'PVC', application: 'Folding Cartons' },
  },
  {
    name: 'Creasing Matrix / Roll',
    category: 'PVC Matrix',
    size: '70cm / 48pcs per box',
    image: '/images/matrix/creasing-matrix-2.png',
    description: 'Complete models support customization. Roll-format creasing matrix for continuous production runs.',
    specs: { thickness: '0.5mm – 1.5mm', sizes: 'Custom Length', material: 'PVC', application: 'High Volume' },
  },
  {
    name: 'Double Groove Creasing Matrix',
    category: 'Fiber Matrix',
    size: '70cm / 48pcs per box',
    image: '/images/matrix/double-groove-creasing-matrix.png',
    description: 'Complete models support customization. Double groove design for enhanced creasing precision on thicker board.',
    specs: { thickness: '1.0mm – 2.5mm', sizes: '65pt – 120pt', material: 'Fiber', application: 'Heavy Board' },
  },
  {
    name: 'Ejection Rubber',
    category: 'Rubber Accessories',
    size: '70cm / 48pcs per box',
    image: '/images/matrix/ejection-rubber-strips.png',
    description: 'Complete models support customization. High-performance ejection rubber strips for clean waste removal.',
    specs: { thickness: 'Various', sizes: 'Standard + Custom', material: 'Rubber', application: 'Die Cutting' },
  },
  {
    name: 'Patching Tape',
    category: 'Patching Materials',
    size: '70cm / 48pcs per box',
    image: '/images/matrix/patching-tape.png',
    description: 'Complete models support customization. Premium patching tape for die board maintenance and repair.',
    specs: { thickness: '0.3mm', sizes: '50m Roll', material: 'Adhesive', application: 'Die Repair' },
  },
  {
    name: 'Tramming Blade',
    category: 'Patching Materials',
    size: '70cm / 48pcs per box',
    image: '/images/matrix/taiming-blade.png',
    description: 'Complete models support customization. Precision tramming blades for die cutting alignment and trimming.',
    specs: { thickness: 'N/A', sizes: 'Standard', material: 'Steel', application: 'Alignment' },
  },
];

const machineryProducts = [
  {
    name: 'Pneumatic Waste Cleaning Machine',
    image: '/images/products/pneumatic-manual-stripping-machinge-2.jpeg',
    description: 'Product Details:',
    features: ['High efficiency pneumatic waste removal', 'A variety of chains to choose from', 'Suitable for a variety of cardboard waste removal', 'Easy waste removal, convenient and fast'],
  },
  {
    name: 'Electric Waste Removal Machine',
    image: '/images/products/pneumatic-manual-stripping-machinge-2.jpeg',
    description: 'Product Details:',
    features: ['No air compressor required, just plug and play', '1-6 Speed adjustment, easy to operate', 'Suitable for a variety of cardboard waste', 'Full copper motor, strong power'],
  },
  {
    name: 'Black Cow Waste Removal Machine',
    image: '/images/products/pneumatic-manual-stripping-machinge-2.jpeg',
    description: 'Product Details:',
    features: ['Powerful pneumatic waste removal machine', 'Motor imported from Taiwan', '18-tooth white steel claws', 'Industrial-grade quality, safe and secure'],
  },
];

const whyChoose = [
  { icon: Target, title: 'High Accuracy', desc: 'Precision-engineered to ±0.01mm tolerance for flawless creasing every time' },
  { icon: Clock, title: 'Long Life', desc: 'Premium imported materials ensure extended service life under heavy production loads' },
  { icon: Award, title: 'Premium Material', desc: 'Imported raw materials from Japan and Germany for consistent quality and performance' },
  { icon: Truck, title: 'Fast Delivery', desc: 'Pan-India delivery within 48 hours. Same-day dispatch for stocked items' },
  { icon: Settings, title: 'Easy Installation', desc: 'Self-adhesive backing for quick, tool-free installation on any die board' },
  { icon: RotateCcw, title: 'Perfect Folding', desc: 'Clean, sharp folds every time — no cracking, no fiber breakout' },
];

const applications = [
  { icon: Box, title: 'Packaging Boxes', desc: 'Corrugated and folding carton packaging for all industries' },
  { icon: HeartPulse, title: 'Medicine Cartons', desc: 'Pharmaceutical packaging with precision creasing for clean folds' },
  { icon: Crown, title: 'Luxury Boxes', desc: 'Premium rigid boxes for cosmetics, electronics, and gifts' },
  { icon: Wine, title: 'Food Packaging', desc: 'Food-safe packaging solutions for snacks, beverages, and confectionery' },
  { icon: Layers, title: 'Corrugated Packaging', desc: 'Heavy-duty creasing for corrugated board up to 12mm thickness' },
  { icon: Printer, title: 'Commercial Printing', desc: 'Offset and digital printing finishing solutions' },
];

const comparison = [
  { feature: 'Creasing Accuracy', traditional: '±0.3mm', bark: '±0.01mm', winner: true },
  { feature: 'Material Durability', traditional: 'Standard PVC', bark: 'Imported Fiber + PVC', winner: true },
  { feature: 'Installation Time', traditional: 'Manual alignment', bark: 'Self-adhesive peel & stick', winner: true },
  { feature: 'Board Compatibility', traditional: 'Limited range', bark: '40pt – 120pt full range', winner: true },
  { feature: 'Service Life', traditional: '50,000 impressions', bark: '150,000+ impressions', winner: true },
  { feature: 'Customization', traditional: 'Fixed sizes only', bark: 'Custom cut to order', winner: true },
];

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export function CreasingMatrixPage() {
  return (
    <div className="min-h-screen bg-gray-950">

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden">
        {/* Ambient backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-gray-950 to-gray-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[1000px] rounded-full bg-primary/[0.04] blur-[150px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-orange-500/[0.03] blur-[120px]" />

        {/* Background image overlay */}
        <div className="absolute inset-0">
          <img
            src="/images/matrix/main-banner.png"
            alt=""
            className="w-full h-full object-cover opacity-[0.07]"
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[12px] text-gray-500 mb-8">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-300">Creasing Matrix</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — Text */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 mb-6">
                <Package className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  Matrix & Accessories
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.08]">
                Creasing Matrix<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
                  & Accessories
                </span>
              </h1>

              <p className="mt-6 text-base sm:text-lg text-gray-400 leading-relaxed max-w-lg">
                Your one-stop shop for all matrix and cutting solutions. Complete range of premium creasing matrix, accessories, and machinery products — manufactured in India with imported materials.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
                <a href="#products" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all duration-200">
                  Browse Products
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link to="/inquiry" className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-6 py-3 text-[14px] font-semibold text-white hover:bg-white/[0.08] transition-all duration-200">
                  Request Quote
                </Link>
              </div>
            </div>

            {/* Right — Floating Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '5000+', label: 'Customers', icon: Star },
                { value: '30+', label: 'Matrix Types', icon: Layers },
                { value: '100%', label: 'Imported Materials', icon: Award },
                { value: '48hr', label: 'Fast Delivery', icon: Truck },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3 group-hover:bg-primary/15 transition-colors">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CATEGORIES ═══════════ */}
      <section className="border-y border-white/[0.06] bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Product Range</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">Matrix Categories</h2>
            <p className="mt-2 text-[14px] text-gray-500 max-w-lg mx-auto">
              Choose from our complete range of creasing matrix types for every application
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <a key={cat.name} href="#products" className="group block">
                <div className={`relative rounded-2xl border border-white/[0.06] bg-gradient-to-br ${cat.color} p-6 hover:border-white/[0.12] hover:shadow-lg transition-all duration-300`}>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] ${cat.iconColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <cat.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-white mb-1">{cat.name}</h3>
                  <p className="text-[13px] text-gray-400 leading-relaxed">{cat.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-[12px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    View Products <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURED MATRIX PRODUCTS ═══════════ */}
      <section id="products" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Featured Products</span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">Matrix Products</h2>
          <p className="mt-2 text-[14px] text-gray-500 max-w-lg mx-auto">
            Complete models support customization. Premium imported materials for precision die cutting.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {matrixProducts.map((product) => (
            <div key={product.name} className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-primary/[0.04] hover:-translate-y-1">
              {/* Image */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-white/[0.04] to-white/[0.01] overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Category badge */}
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center rounded-lg bg-gray-950/80 backdrop-blur-sm border border-white/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-300">
                    {product.category}
                  </span>
                </div>
                {/* Hover arrow */}
                <div className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 shadow-lg shadow-primary/30">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-gray-950/60 to-transparent" />
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center rounded-md bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[10px] text-gray-400 font-mono">
                    {product.size}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-white group-hover:text-primary transition-colors leading-snug">
                  {product.name}
                </h3>
                <p className="mt-2 text-[13px] text-gray-500 leading-relaxed line-clamp-2">
                  {product.description}
                </p>

                {/* Specs preview */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {Object.entries(product.specs).map(([key, val]) => (
                    <div key={key} className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-2.5 py-1.5">
                      <p className="text-[9px] uppercase tracking-wider text-gray-600">{key}</p>
                      <p className="text-[11px] text-gray-300 font-medium">{val}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2">
                  <a href="tel:+918810597980" className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-[12px] font-semibold text-primary hover:bg-primary/15 transition-colors">
                    <Phone className="h-3 w-3" />
                    Request Quote
                  </a>
                  <Link to="/products" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] font-medium text-gray-400 hover:bg-white/[0.06] hover:text-white transition-colors">
                    Details
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ WHY CHOOSE OUR MATRIX ═══════════ */}
      <section className="border-y border-white/[0.06] bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">The Bark Advantage</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">Why Choose Our Matrix</h2>
            <p className="mt-2 text-[14px] text-gray-500 max-w-lg mx-auto">
              Engineered for precision. Built for performance. Trusted by 5000+ customers across India.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whyChoose.map((item) => (
              <div key={item.title} className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary/15 transition-colors">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-1.5">{item.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ APPLICATIONS ═══════════ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Industry Solutions</span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">Applications</h2>
          <p className="mt-2 text-[14px] text-gray-500 max-w-lg mx-auto">
            Our matrix products are trusted across multiple packaging and printing industries
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <div key={app.title} className="group flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                <app.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-white mb-0.5">{app.title}</h3>
                <p className="text-[12px] text-gray-500 leading-relaxed">{app.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ TECHNICAL COMPARISON ═══════════ */}
      <section className="border-y border-white/[0.06] bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Performance</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">Technical Advantages</h2>
            <p className="mt-2 text-[14px] text-gray-500 max-w-lg mx-auto">
              See how Bark Matrix compares to traditional creasing solutions
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 border-b border-white/[0.06]">
              <div className="px-5 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">Feature</div>
              <div className="px-5 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500 text-center">Traditional Matrix</div>
              <div className="px-5 py-4 text-[12px] font-semibold uppercase tracking-wider text-primary text-center bg-primary/[0.03]">Bark Matrix</div>
            </div>
            {/* Rows */}
            {comparison.map((row, i) => (
              <div key={row.feature} className={`grid grid-cols-3 ${i < comparison.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
                <div className="px-5 py-3.5 text-[13px] text-gray-300 font-medium">{row.feature}</div>
                <div className="px-5 py-3.5 text-[13px] text-gray-500 text-center">{row.traditional}</div>
                <div className="px-5 py-3.5 text-[13px] text-primary font-semibold text-center bg-primary/[0.03] flex items-center justify-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {row.bark}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ MACHINERY PRODUCTS ═══════════ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Machinery</span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">Machinery & Accessories</h2>
          <p className="mt-2 text-[14px] text-gray-500 max-w-lg mx-auto">
            Complete range of waste removal machines and die-cutting accessories
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {machineryProducts.map((product) => (
            <div key={product.name} className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-primary/[0.04] hover:-translate-y-1">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-white/[0.04] to-white/[0.01] overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center rounded-lg bg-gray-950/80 backdrop-blur-sm border border-white/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-300">
                    Machinery
                  </span>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-gray-950/60 to-transparent" />
              </div>
              <div className="p-5">
                <h3 className="text-[15px] font-semibold text-white group-hover:text-primary transition-colors">{product.name}</h3>
                <ul className="mt-3 space-y-1.5">
                  {product.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-gray-400">
                      <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="tel:+918810597980" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-[12px] font-semibold text-primary hover:bg-primary/15 transition-colors">
                  <Phone className="h-3 w-3" />
                  Request Quote
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ NEED HELP CHOOSING ═══════════ */}
      <section className="border-y border-white/[0.06] bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-8 sm:p-12 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
              <Settings className="h-7 w-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Need Help Choosing?</h2>
            <p className="text-[14px] text-gray-400 max-w-lg mx-auto mb-8 leading-relaxed">
              Our technical team can help you select the right matrix for your specific die-cutting requirements. 
              Get expert guidance on thickness, size, and material compatibility.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="tel:+918810597980" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all duration-200">
                <Phone className="h-4 w-4" />
                Call: +91 8810597980
              </a>
              <Link to="/inquiry" className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-6 py-3 text-[14px] font-semibold text-white hover:bg-white/[0.08] transition-all duration-200">
                Request Quote
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ QUOTE CTA ═══════════ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-orange-600 p-8 sm:p-14 text-white text-center shadow-2xl shadow-primary/20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzRtMCA0djJIMnYtMmgzNG0wIDR2MkgzdjJoMzNtMCA0djJINHYtaWgzM3oiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          <div className="relative">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4">Ready to Order?</h2>
            <p className="text-white/90 max-w-xl mx-auto mb-8 text-[15px] leading-relaxed">
              Get premium creasing matrix products at competitive prices. 
              Bulk orders, custom sizes, and OEM requirements welcome.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="tel:+918810597980" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[14px] font-semibold text-primary shadow-lg hover:bg-white/90 transition-all duration-200">
                <Phone className="h-4 w-4" />
                +91 8810597980
              </a>
              <Link to="/inquiry" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-[14px] font-semibold text-white hover:bg-white/20 transition-all duration-200">
                Contact Sales
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TRUST BAR ═══════════ */}
      <section className="border-t border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-[13px] text-gray-500">
            Trusted across India and neighbouring countries since 2019
          </p>
          <p className="text-primary font-bold text-lg mt-2">+91 8810597980</p>
        </div>
      </section>

    </div>
  );
}
