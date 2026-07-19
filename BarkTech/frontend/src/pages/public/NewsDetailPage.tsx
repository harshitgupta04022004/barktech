import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Phone, Share2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const newsItems = [
  {
    id: 1,
    title: 'Our Latest Consignment is Being Loaded into Containers!',
    subtitle: 'Sheet Cutter / NC Cutter Machine — Upcoming to India',
    date: '2023-09-16',
    image: '/images/news-images/166.png',
    category: 'Consignment',
    fullContent: `Big News! Our latest consignment is being loaded into containers, featuring a high-performance Sheet Cutter/NC Cutter Machine, en route from China to India!

This cutting-edge machine is a game-changer in precision cutting, designed to elevate your production processes to new heights.

## Key Features

- **Precision Cutting**: Advanced CNC technology for accurate, repeatable cuts
- **High Speed**: Optimized for high-volume production environments
- **Versatile Material Support**: Handles a wide range of cardboard and paperboard materials
- **User-Friendly Interface**: Intuitive controls for easy operation and setup
- **Durable Construction**: Built with industrial-grade components for long-lasting performance

## Technical Specifications

- Cutting Speed: Up to 80 sheets/minute
- Cutting Accuracy: ±0.1mm
- Material Thickness: 0.5mm - 15mm
- Working Area: 1200mm x 800mm
- Power Supply: 380V/50Hz

## Why This Matters

The Sheet Cutter/NC Cutter Machine represents a significant upgrade in our product lineup. It allows our customers to achieve precision cutting results that were previously only possible with much more expensive equipment.

Our team has been working closely with the manufacturer to ensure this machine meets the highest quality standards. We expect it to be available for demonstration at our Ghaziabad facility within the next few weeks.

## Availability

Interested customers are encouraged to contact us for:
- Pre-order reservations
- Demonstration scheduling
- Technical specifications and pricing

Contact: +91 8810597980 | sales1@barktechnologies.in`,
  },
  {
    id: 2,
    title: 'Our Latest Consignment is Being Loaded into Containers!',
    subtitle: 'Single Color Flexo Machine — Upcoming to India',
    date: '2023-09-16',
    image: '/images/news-images/16.png',
    category: 'Consignment',
    fullContent: `Big News! Our latest consignment is being loaded into containers, featuring a high-performance Single Color Flexo Machine, en route from China to India!

This machine delivers vibrant single-color flexographic printing for packaging and labeling applications, offering exceptional print quality at competitive prices.

## Key Features

- **Superior Print Quality**: Consistent, vibrant single-color printing on various substrates
- **Fast Setup**: Quick changeover between jobs for maximum productivity
- **Ink Efficiency**: Advanced ink delivery system minimizes waste
- **Robust Design**: Heavy-duty construction for continuous industrial operation
- **Easy Maintenance**: Simple cleaning and maintenance procedures

## Applications

- Corrugated box printing
- Paper bag printing
- Flexible packaging
- Label printing
- Carton printing

## Technical Specifications

- Print Speed: Up to 100 meters/minute
- Print Width: Up to 600mm
- Substrate Types: Kraft paper, corrugated board, cardboard
- Ink Type: Water-based / UV curable
- Color Stations: 1

## Why Choose Our Flexo Machine?

Our Single Color Flexo Machine offers the perfect balance of quality, speed, and affordability. Whether you're a small business looking to bring printing in-house or a large operation seeking to expand capacity, this machine delivers exceptional value.

Contact us today for pricing and availability!`,
  },
  {
    id: 3,
    title: 'Our Latest Consignment is Being Loaded into Containers!',
    subtitle: 'Semi Automatic Die Machine — Upcoming to India',
    date: '2023-08-29',
    image: '/images/news-images/29.mp4',
    isVideo: true,
    category: 'Consignment',
    fullContent: `Big News! Our latest consignment is being loaded into containers, featuring a high-performance Semi Automatic Die Cutting Machine, en route from China to India!

This machine combines manual precision with automated efficiency for die cutting operations, making it ideal for businesses that need flexibility without sacrificing quality.

## Key Features

- **Semi-Automatic Operation**: Combines manual feeding with automated cutting for precision
- **Adjustable Pressure**: Fine-tune cutting pressure for different materials
- **Safety Features**: Multiple safety mechanisms to protect operators
- **Compact Footprint**: Designed to fit in workshops of all sizes
- **Low Maintenance**: Minimal moving parts for easy upkeep

## How It Works

1. Place the die on the cutting plate
2. Position the material under the die
3. The machine applies precise pressure to cut the material
4. Remove the finished product and repeat

## Ideal For

- Small to medium production runs
- Custom packaging design
- Prototype development
- Specialty printing operations

## Technical Specifications

- Cutting Area: 1000mm x 700mm
- Maximum Pressure: 200 tons
- Material Thickness: Up to 20mm
- Motor Power: 3kW
- Weight: 2,500 kg

## Availability

This Semi Automatic Die Cutting Machine will be available for demonstration at our facility. Contact us to schedule a visit!`,
  },
  {
    id: 4,
    title: 'Installation and Updates!',
    subtitle: 'Automatic Flute Laminator Machine — Successful Installation in Gujarat',
    date: '2023-08-08',
    image: '/images/news-images/gujrat.png',
    category: 'Installation',
    fullContent: `Successful installation of our new Automatic Flute Laminator Machine in Morbi, Gujarat!

Experience the cutting-edge technology that elevates packaging solutions to new heights! This installation marks another milestone in our expanding presence across India.

## Installation Details

- **Location**: Morbi, Gujarat
- **Machine**: Automatic Flute Laminator
- **Client**: Leading packaging manufacturer in Gujarat
- **Date**: August 2023
- **Status**: Fully operational

## What is Flute Lamination?

Flute lamination is the process of bonding a printed liner to a corrugated flute board, creating a strong, visually appealing packaging material. Our Automatic Flute Laminator delivers:

- **High Precision**: Accurate registration between liner and flute
- **Consistent Quality**: Automated alignment ensures uniform results
- **Fast Production**: High-speed operation for large volume orders
- **Versatile Material Support**: Works with various flute types (A, B, C, E, F)

## Benefits for the Client

1. **Increased Capacity**: The new machine significantly boosts production output
2. **Improved Quality**: Automated precision eliminates manual inconsistencies
3. **Cost Efficiency**: Reduced waste and faster setup times
4. **Competitive Edge**: Ability to take on larger, more complex orders

## Client Testimonial

> "The installation process was smooth and professional. The Bark Technologies team provided excellent training and support. We're already seeing improved quality and productivity in our packaging operations."

## Looking Forward

This successful installation reinforces our commitment to providing the best packaging machinery solutions across India. We continue to expand our installation base across Gujarat, Maharashtra, and other key industrial regions.

Interested in our Automatic Flute Laminator? Contact us for a demonstration!`,
  },
];

const categoryColors: Record<string, string> = {
  Consignment: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Installation: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  Events: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'Company News': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  'Product Launch': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
};

export function NewsDetailPage() {
  const { id } = useParams();
  const item = newsItems.find((n) => n.id === Number(id));

  if (!item) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4 text-black dark:text-white">Article Not Found</h1>
        <Link to="/news">
          <Button variant="outline"><ArrowLeft className="h-4 w-4" /> Back to News</Button>
        </Link>
      </div>
    );
  }

  const related = newsItems.filter((n) => n.id !== item.id).slice(0, 3);

  const renderContent = (content: string) => {
    return content.split('\n\n').map((block, i) => {
      if (block.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold text-black dark:text-white mt-8 mb-4">{block.replace('## ', '')}</h2>;
      }
      if (block.startsWith('- **')) {
        const items = block.split('\n').filter(Boolean);
        return (
          <ul key={i} className="space-y-2 my-4">
            {items.map((li, j) => {
              const text = li.replace(/^- /, '');
              const boldMatch = text.match(/\*\*(.*?)\*\*(.*)/);
              return (
                <li key={j} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  <span>
                    {boldMatch ? (
                      <><strong className="text-black dark:text-white">{boldMatch[1]}</strong>{boldMatch[2]}</>
                    ) : text}
                  </span>
                </li>
              );
            })}
          </ul>
        );
      }
      if (block.startsWith('> ')) {
        return (
          <blockquote key={i} className="border-l-4 border-primary pl-4 py-2 my-4 italic text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-r-lg">
            {block.replace(/^> /gm, '')}
          </blockquote>
        );
      }
      if (block.match(/^\d\. /)) {
        const items = block.split('\n').filter(Boolean);
        return (
          <ol key={i} className="space-y-2 my-4 list-decimal list-inside">
            {items.map((li, j) => (
              <li key={j} className="text-gray-700 dark:text-gray-300">{li.replace(/^\d\. /, '')}</li>
            ))}
          </ol>
        );
      }
      return <p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed my-4">{block}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Image */}
      <div className="relative h-[400px] bg-gray-900 overflow-hidden">
        {item.isVideo ? (
          <video src={item.image} className="w-full h-full object-cover" controls muted />
        ) : (
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="mx-auto max-w-4xl">
            <Link to="/news" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to News
            </Link>
            <div className="flex items-center gap-3 mb-3">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${categoryColors[item.category] || 'bg-gray-100 text-gray-700'}`}>
                {item.category}
              </span>
              <span className="flex items-center gap-1 text-sm text-white/70">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1 text-sm text-white/70">
                <Clock className="h-3.5 w-3.5" />
                5 min read
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{item.title}</h1>
            <p className="text-lg text-primary font-medium">{item.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              {renderContent(item.fullContent)}
            </div>

            {/* Share */}
            <div className="mt-6 flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Share this article:</span>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary hover:text-white transition-colors">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-6">
                <h3 className="font-bold text-black dark:text-white mb-3">Need More Information?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Contact our team for details about this {item.category.toLowerCase()}.
                </p>
                <a href="tel:+918810597980">
                  <Button className="w-full gap-2">
                    <Phone className="h-4 w-4" />
                    Call: +91 8810597980
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Related Articles */}
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-6">
                <h3 className="font-bold text-black dark:text-white mb-4">Related Articles</h3>
                <div className="space-y-4">
                  {related.map((rel) => (
                    <Link key={rel.id} to={`/news/${rel.id}`} className="flex gap-3 group">
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {rel.isVideo ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                            <Play className="h-4 w-4 text-gray-500" />
                          </div>
                        ) : (
                          <img src={rel.image} alt={rel.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(rel.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <p className="text-sm font-medium text-black dark:text-white group-hover:text-primary transition-colors line-clamp-2">{rel.subtitle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
