import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, ArrowRight } from 'lucide-react';

// ── Matrix Products (exact images from barktechnologies.in/creasing-matrix.html) ──
const matrixProducts = [
  {
    name: 'Creasing Matrix / Box',
    size: '70cm / 48pcs per box',
    image: '/images/matrix/creasing-matrix-1.png',
    description: 'Complete models support customization. High-quality creasing matrix for precision die cutting and creasing operations.',
  },
  {
    name: 'Creasing Matrix / Roll',
    size: '70cm / 48pcs per box',
    image: '/images/matrix/creasing-matrix-2.png',
    description: 'Complete models support customization. Roll-format creasing matrix for continuous production runs.',
  },
  {
    name: 'Double Groove Creasing Matrix',
    size: '70cm / 48pcs per box',
    image: '/images/matrix/double-groove-creasing-matrix.png',
    description: 'Complete models support customization. Double groove design for enhanced creasing precision on thicker board.',
  },
  {
    name: 'Ejection Rubber',
    size: '70cm / 48pcs per box',
    image: '/images/matrix/ejection-rubber-strips.png',
    description: 'Complete models support customization. High-performance ejection rubber strips for clean waste removal.',
  },
  {
    name: 'Patching Tape',
    size: '70cm / 48pcs per box',
    image: '/images/matrix/patching-tape.png',
    description: 'Complete models support customization. Premium patching tape for die board maintenance and repair.',
  },
  {
    name: 'Tramming Blade',
    size: '70cm / 48pcs per box',
    image: '/images/matrix/taiming-blade.png',
    description: 'Complete models support customization. Precision tramming blades for die cutting alignment and trimming.',
  },
];

// ── Machinery Products (from barktechnologies.in/creasing-matrix.html) ──
const machineryProducts = [
  {
    name: 'Pneumatic Waste Cleaning Machine',
    image: '/images/products/pneumatic-manual-stripping-machinge-2.jpeg',
    description: 'Product Details:',
    features: [
      'High efficiency pneumatic waste removal',
      'A variety of chains to choose from',
      'Suitable for a variety of cardboard waste removal',
      'Easy waste removal, convenient and fast',
    ],
  },
  {
    name: 'Electric Waste Removal Machine',
    image: '/images/products/pneumatic-manual-stripping-machinge-2.jpeg',
    description: 'Product Details:',
    features: [
      'No air compressor required, just plug and play',
      '1-6 Speed adjustment, easy to operate',
      'Suitable for a variety of cardboard waste',
      'Full copper motor, strong power',
    ],
  },
  {
    name: 'Black Cow Waste Removal Machine',
    image: '/images/products/pneumatic-manual-stripping-machinge-2.jpeg',
    description: 'Product Details:',
    features: [
      'Powerful pneumatic waste removal machine',
      'Motor imported from Taiwan',
      '18-tooth white steel claws',
      'Industrial-grade quality, safe and secure',
    ],
  },
];

export function CreasingMatrixPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Banner — exact banner from barktechnologies.in */}
      <section className="relative bg-gradient-to-r from-gray-900 to-gray-800 text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/matrix/main-banner.png"
            alt="Bark Technologies Creasing Matrix"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-bold text-xl shadow-lg">BT</div>
            <div>
              <span className="text-lg font-bold">Bark Technologies</span>
              <p className="text-xs text-gray-300">Leading Matrix Manufacturer in India</p>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Creasing Matrix & Accessories</h1>
          <p className="text-lg text-gray-300 max-w-2xl mb-8">
            Your one-stop shop for all matrix and cutting solutions. Complete range of creasing matrix, accessories, and machinery products.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <a href="tel:+918810597980">
              <Button size="lg" className="gap-2 shadow-lg">
                <Phone className="h-4 w-4" />
                Call: +91 8810597980
              </Button>
            </a>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                Request Quote
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Matrix Products Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">New Products</span>
          <h2 className="mt-2 text-3xl font-bold text-black dark:text-white">Matrix Products</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            BT Creasing Matrix — your one-stop shop for all matrix and cutting solutions. Complete models support customization.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {matrixProducts.map((product) => (
            <Card key={product.name} className="overflow-hidden hover:shadow-xl transition-all duration-300 group dark:bg-gray-900 dark:border-gray-800">
              <div className="aspect-square bg-white dark:bg-gray-800 flex items-center justify-center p-8 overflow-hidden border-b dark:border-gray-700">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-5">
                <span className="text-xs text-primary font-semibold uppercase tracking-wide">Creasing Matrix</span>
                <h3 className="mt-1 text-lg font-bold text-black dark:text-white">{product.name}</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 inline-block px-2 py-0.5 rounded">{product.size}</p>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{product.description}</p>
                <a href="tel:+918810597980" className="mt-4 inline-flex">
                  <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90">
                    <Phone className="h-3 w-3" />
                    Request to Call Back
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Machinery Products Section */}
      <section className="bg-gray-50 dark:bg-gray-900 border-y dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Machinery Products</span>
            <h2 className="mt-2 text-3xl font-bold text-black dark:text-white">Machinery & Accessories</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              BT Creasing Matrix — your one-stop shop for all machinery products and accessories.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {machineryProducts.map((product) => (
              <Card key={product.name} className="overflow-hidden hover:shadow-xl transition-all duration-300 group dark:bg-gray-900 dark:border-gray-800">
                <div className="aspect-video bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden border-b dark:border-gray-700">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-5">
                  <span className="text-xs text-primary font-semibold uppercase tracking-wide">Machinery</span>
                  <h3 className="mt-1 text-lg font-bold text-black dark:text-white">{product.name}</h3>
                  <p className="mt-1 text-xs font-medium text-gray-700 dark:text-gray-300">{product.description}</p>
                  <ul className="mt-3 space-y-2">
                    {product.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <a href="tel:+918810597980" className="mt-4 inline-flex">
                    <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90">
                      <Phone className="h-3 w-3" />
                      Request to Call Back
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-orange-600 p-8 sm:p-12 text-white text-center shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Need Custom Creasing Solutions?</h2>
          <p className="text-white/90 max-w-xl mx-auto mb-8 text-lg">
            We offer complete customization for all matrix products. Contact us for bulk orders, custom sizes, and OEM requirements.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="tel:+918810597980">
              <Button size="lg" variant="secondary" className="gap-2 shadow-lg">
                <Phone className="h-4 w-4" />
                +91 8810597980
              </Button>
            </a>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10 gap-2">
                Contact Sales
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="bg-gray-900 dark:bg-black py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-300 text-sm">
            We Control A High Quality Service In India As Well As Neighbouring Countries With Trust Since 2019
          </p>
          <p className="text-primary font-bold text-lg mt-2">+91 8810597980</p>
        </div>
      </section>
    </div>
  );
}
