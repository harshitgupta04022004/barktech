import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Share2, Facebook, Linkedin, Twitter, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
  readTime: string;
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'How Die Cutting Technology is Revolutionizing Packaging',
    slug: 'die-cutting-revolutionizing-packaging',
    excerpt: 'Explore how modern die cutting machines are transforming the packaging industry with precision, speed, and versatility.',
    content: `Die cutting has been a cornerstone of the packaging industry for decades, but recent technological advancements have transformed this traditional process into a cutting-edge, precision-driven operation that's reshaping how businesses approach packaging production.

## The Evolution of Die Cutting

From manual platen presses to fully automated CNC die cutting machines, the technology has evolved dramatically. Modern machines offer:

- **Computer-controlled precision**: CNC technology ensures consistent, repeatable cuts with accuracy down to 0.1mm
- **High-speed production**: Automated feeding and cutting systems can process hundreds of sheets per minute
- **Versatile material handling**: From thin paper to thick corrugated board, modern die cutters handle it all
- **Quick changeover**: Digital die systems allow rapid switching between different cutting patterns

## Key Benefits for Packaging Manufacturers

### Increased Efficiency
Modern die cutting machines significantly reduce production time. What used to take hours can now be completed in minutes, allowing manufacturers to handle larger orders and tighter deadlines.

### Reduced Waste
Precision cutting means less material waste. Advanced nesting algorithms optimize sheet layouts to maximize material usage, reducing costs and environmental impact.

### Consistent Quality
Automated systems eliminate human error, ensuring every piece is cut to exact specifications. This consistency is crucial for high-quality packaging that fits perfectly every time.

### Cost Savings
While the initial investment may be significant, the long-term savings from increased efficiency, reduced waste, and lower labor costs make modern die cutting machines a smart business decision.

## Choosing the Right Die Cutting Machine

When selecting a die cutting machine for your packaging operations, consider:

1. **Production volume**: Match the machine's speed to your daily output requirements
2. **Material types**: Ensure the machine handles your specific materials
3. **Cutting complexity**: More intricate designs may require higher-precision equipment
4. **Budget**: Balance features with your investment capacity
5. **Space requirements**: Consider the machine's footprint in your facility

## The Future of Die Cutting

With AI-driven optimization, predictive maintenance, and Industry 4.0 integration, the future of die cutting looks incredibly promising. Machines are becoming smarter, more connected, and more efficient than ever before.

At Bark Technologies, we offer a comprehensive range of die cutting machines from semi-automatic to fully automatic, designed to meet the needs of packaging manufacturers of all sizes.

Contact us today to learn more about how our die cutting solutions can transform your packaging operations.`,
    featuredImage: '/images/products/Automatic-Die-Cutting-and-Creasing-Machine.png',
    category: 'Industry Insights',
    author: 'Bark Technologies Team',
    date: '2026-07-15',
    tags: ['die cutting', 'packaging', 'automation'],
    readTime: '6 min read',
  },
  {
    id: '2',
    title: 'Choosing the Right Flute Laminator for Your Business',
    slug: 'choosing-right-flute-laminator',
    excerpt: 'A comprehensive guide to selecting the perfect flute laminator machine based on your production needs, budget, and material types.',
    content: `Flute lamination is a critical process in corrugated packaging production. Selecting the right flute laminator can make a significant difference in your product quality, production efficiency, and bottom line.

## Understanding Flute Lamination

Flute lamination involves bonding a printed liner sheet to a corrugated flute board, creating a composite material that combines the visual appeal of printed graphics with the structural strength of corrugated board.

## Types of Flute Laminators

### Semi-Automatic Flute Laminators
Best for small to medium production volumes:
- Lower initial investment
- Operator involvement for feeding
- Suitable for diverse job types
- Good for businesses with varying order sizes

### High-Speed Automatic Flute Laminators
Ideal for high-volume production:
- Fully automated feeding and bonding
- Consistent registration accuracy
- High throughput rates
- Best for large, repeat orders

### Automatic Flute Laminators with Integrated Features
Premium solutions with additional capabilities:
- Built-in pre-heating systems
- Automated胶水 (glue) application
- Quality inspection systems
- Production tracking and reporting

## Key Factors to Consider

### 1. Production Volume
Match the machine's capacity to your daily output requirements. A machine that's too small will bottleneck your production, while an oversized machine wastes resources.

### 2. Material Compatibility
Ensure the laminator works with your specific materials:
- Flute types (A, B, C, E, F)
- Liner weights and thicknesses
- Special coatings or treatments

### 3. Registration Accuracy
For high-quality packaging, registration between the liner and flute must be precise. Look for machines with:
- Vision-guided alignment systems
- Fine adjustment controls
- Consistent accuracy across the full speed range

### 4. Glue Application System
The type of glue application affects both quality and cost:
- Roller coating: Consistent, thin application
- Spray systems: Flexible, good for complex shapes
- Hot melt vs. cold glue options

### 5. Maintenance and Support
Consider the availability of:
- Spare parts
- Technical support
- Training programs
- Service contracts

## Making the Right Choice

The best flute laminator for your business depends on your specific needs. At Bark Technologies, we offer a range of flute laminating solutions and can help you select the perfect machine for your operation.

Contact our team for a personalized consultation and demonstration.`,
    featuredImage: '/images/products/high-speed-automatic-flute-laminator.png',
    category: 'How-To Guides',
    author: 'Bark Technologies Team',
    date: '2026-07-10',
    tags: ['flute laminator', 'buying guide', 'machinery'],
    readTime: '8 min read',
  },
  {
    id: '3',
    title: 'Introducing Our New High-Speed Folder Gluer Machine',
    slug: 'new-high-speed-folder-gluer',
    excerpt: 'We are excited to announce the arrival of our latest high-speed automatic folder gluer machine, designed for maximum efficiency.',
    content: `We are thrilled to introduce our latest addition to the Bark Technologies product lineup — the High-Speed Automatic Folder Gluer Machine. This state-of-the-art machine represents the future of box manufacturing.

## What Makes It Special

### Unmatched Speed
Our new folder gluer operates at industry-leading speeds, capable of producing up to 300 boxes per minute. This means higher throughput and faster order fulfillment for our customers.

### Precision Engineering
Every fold and glue application is computer-controlled, ensuring:
- Perfect 90-degree folds
- Consistent glue placement
- Uniform box dimensions
- Zero defect rates

### Versatile Box Types
This machine handles a wide range of box styles:
- Straight-line boxes
- Crash-lock bottom boxes
- Four-corner boxes
- Six-corner boxes
- Partition boxes

### User-Friendly Interface
The intuitive touchscreen control panel makes operation simple:
- One-touch job recall
- Real-time production monitoring
- Automatic setup for different box sizes
- Maintenance alerts and diagnostics

## Technical Specifications

- Speed: Up to 300 boxes/minute
- Box Size Range: 80mm x 60mm to 800mm x 600mm
- Paper Weight: 200-500 gsm
- Glue System: Hot melt, dual application heads
- Power Supply: 380V/50Hz, 15kW
- Dimensions: 12m x 2m x 2m

## Why Upgrade to Our Folder Gluer?

If you're currently using manual or semi-automatic folding and gluing, upgrading to our high-speed automatic machine will:

1. **Increase production capacity by 5-10x**
2. **Reduce labor costs significantly**
3. **Improve box quality and consistency**
4. **Handle more complex box designs**
5. **Reduce material waste**

## Availability

This machine is now available for demonstration at our facility. We invite you to see it in action and discuss how it can benefit your operations.

Contact us today to schedule a visit!`,
    featuredImage: '/images/products/Automatic-folder-gluer.png',
    category: 'Product Updates',
    author: 'Bark Technologies Team',
    date: '2026-07-05',
    tags: ['folder gluer', 'new product', 'automation'],
    readTime: '5 min read',
  },
  {
    id: '4',
    title: 'Why Indian Packaging Industry is Growing at 15% CAGR',
    slug: 'indian-packaging-industry-growth',
    excerpt: 'India packaging industry is booming. Discover the key drivers behind this growth and how packaging machinery suppliers are adapting.',
    content: `The Indian packaging industry is experiencing unprecedented growth, with a compound annual growth rate (CAGR) of approximately 15%. This remarkable expansion is driven by multiple factors that are reshaping the landscape of packaging manufacturing in the country.

## Key Growth Drivers

### 1. E-Commerce Boom
The rapid growth of e-commerce in India has created massive demand for packaging materials. Every product shipped requires protective packaging, driving demand for corrugated boxes, cushioning materials, and specialized packaging solutions.

### 2. Food & Beverage Sector
India's food processing industry is growing at an impressive rate, requiring sophisticated packaging solutions that ensure:
- Freshness preservation
- Extended shelf life
- Attractive branding
- Food safety compliance

### 3. Consumer Goods Expansion
With rising disposable incomes, the consumer goods sector is expanding rapidly. FMCG companies need attractive, functional packaging that stands out on shelves.

### 4. Government Initiatives
Programs like Make in India and Atmanirbhar Bharat are encouraging domestic manufacturing, including packaging machinery production.

### 5. Sustainability Focus
Growing environmental awareness is driving demand for:
- Eco-friendly packaging materials
- Recyclable solutions
- Minimal packaging designs
- Sustainable production processes

## Impact on Packaging Machinery

This growth has created enormous opportunities for packaging machinery suppliers. Companies investing in modern, efficient machines are seeing:

- **Higher production volumes** to meet increasing demand
- **Better quality** to match international standards
- **Lower per-unit costs** through automation
- **Competitive advantage** in the market

## Bark Technologies: Supporting India's Growth

At Bark Technologies, we are committed to supporting this growth by providing:
- State-of-the-art die cutting machines
- High-speed flute laminators
- Advanced printing solutions
- Complete packaging line solutions

Our machines are designed to help Indian manufacturers compete globally while maintaining cost efficiency.

## Looking Ahead

With the Indian packaging market projected to reach $200 billion by 2030, the opportunities are immense. Companies that invest in the right technology today will be well-positioned to capture this growth.

Contact us to learn how Bark Technologies can support your packaging business growth.`,
    featuredImage: '/images/1.jpg',
    category: 'Industry Insights',
    author: 'Bark Technologies Team',
    date: '2026-06-28',
    tags: ['industry growth', 'india', 'packaging market'],
    readTime: '7 min read',
  },
  {
    id: '5',
    title: 'Complete Guide to Creasing Matrix Selection',
    slug: 'creasing-matrix-selection-guide',
    excerpt: 'Learn how to choose the right creasing matrix for your die cutting operations — from double groove to patching tape solutions.',
    content: `The creasing matrix is a small but crucial component in the die cutting process. Selecting the right matrix can significantly impact the quality of your finished packaging products.

## What is a Creasing Matrix?

A creasing matrix is a thin strip placed on the cutting plate of a die cutting machine. It creates a precise crease line in the material, allowing it to fold cleanly without cracking or breaking.

## Types of Creasing Matrices

### Single Groove Creasing Matrix
- Best for standard corrugated board
- Creates a single crease line
- Available in various groove widths
- Cost-effective for basic applications

### Double Groove Creasing Matrix
- Ideal for heavy-duty corrugated board
- Creates two parallel crease lines
- Better fold quality on thick materials
- Reduced cracking at fold points

### Creasing Matrix for Thin Materials
- Designed for paper and light cardstock
- Narrower groove profiles
- Precision-engineered for fine work
- Essential for high-quality folding cartons

### Patching Tape
- Used for die board modification
- Adjustable crease positioning
- Quick setup and changeover
- Useful for short runs and prototyping

## Selection Criteria

### Material Thickness
The most important factor is matching the matrix to your material:
- Thin paper: 0.3-0.5mm groove
- Standard cardboard: 0.5-0.7mm groove
- Heavy corrugated: 0.7-1.0mm groove
- Double-wall board: 1.0-1.5mm groove

### Groove Width
Select the appropriate groove width based on:
- Material type and thickness
- Required fold angle
- Production speed
- Die cutting machine specifications

### Durability
Consider the expected lifespan:
- Steel matrices: Most durable, best for high-volume production
- Plastic matrices: Cost-effective for moderate volumes
- Composite matrices: Balance of durability and cost

## Installation Tips

1. Clean the cutting plate thoroughly before installation
2. Align the matrix precisely with the score line on the die
3. Use adhesive that's compatible with your machine
4. Test with a sample before full production
5. Replace matrices when groove wear becomes visible

## Bark Technologies Creasing Matrix Solutions

We offer a comprehensive range of creasing matrices and patching tapes designed for all types of die cutting operations.

Browse our creasing matrix products or contact us for expert guidance on selection.`,
    featuredImage: '/images/matrix/main-banner.png',
    category: 'How-To Guides',
    author: 'Bark Technologies Team',
    date: '2026-06-20',
    tags: ['creasing matrix', 'die cutting', 'guide'],
    readTime: '9 min read',
  },
  {
    id: '6',
    title: 'Successful Installation: Semi-Automatic Die Cutter in Maharashtra',
    slug: 'installation-maharashtra-die-cutter',
    excerpt: 'See how we helped a leading packaging company in Maharashtra streamline their operations with our semi-automatic die cutting machine.',
    content: `We are proud to share the details of our recent successful installation of a Semi-Automatic Die Cutting and Creasing Machine at a leading packaging company in Maharashtra.

## Client Background

Our client is a mid-sized packaging manufacturer based in Maharashtra, serving the food and beverage industry. They were looking to upgrade their production capabilities to handle increasing order volumes while maintaining quality standards.

## The Challenge

Before the installation, the client was facing several operational challenges:
- Manual die cutting processes limiting production speed
- Inconsistent cut quality across different operators
- Difficulty meeting tight delivery deadlines
- High rejection rates due to imprecise cuts
- Limited ability to take on complex box designs

## Our Solution

We recommended our Semi-Automatic Die Cutting and Creasing Machine, which offers the perfect balance of automation and operator control:

### Key Features Deployed
- **Adjustable cutting pressure**: From 50 to 200 tons
- **Large cutting area**: 1000mm x 700mm
- **Quick die changeover**: Less than 5 minutes
- **Safety features**: Dual-hand operation, emergency stop, safety curtains
- **Digital controls**: Precise pressure and timing adjustments

### Installation Process
1. **Site assessment**: Our team evaluated the facility layout and power requirements
2. **Machine delivery**: Secure transport and careful positioning
3. **Installation**: Professional setup and calibration
4. **Training**: Comprehensive operator and maintenance training
5. **Testing**: Production trials to verify performance

## Results

Since the installation, our client has experienced:
- **40% increase** in production speed
- **60% reduction** in rejection rates
- **Ability to handle complex designs** previously not possible
- **Improved worker safety** and satisfaction
- **Faster turnaround times** for customer orders

## Client Testimonial

> "The installation process was smooth and professional. The Bark Technologies team provided excellent training and support. We're already seeing improved quality and productivity in our packaging operations. The machine has paid for itself in just 8 months."

## Looking Forward

This successful installation reinforces our commitment to supporting packaging manufacturers across India. We continue to expand our installation base across Maharashtra, Gujarat, and other key industrial regions.

Interested in our die cutting solutions? Contact us for a demonstration!`,
    featuredImage: '/images/news-images/gujrat.png',
    category: 'Company News',
    author: 'Bark Technologies Team',
    date: '2026-06-15',
    tags: ['installation', 'case study', 'maharashtra'],
    readTime: '6 min read',
  },
];

export function BlogDetailPage() {
  const { id } = useParams();
  const post = blogPosts.find((p) => p.id === id);

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return blogPosts
      .filter((p) => p.id !== post.id && p.category === post.category)
      .slice(0, 3);
  }, [post]);

  if (!post) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="mb-4 text-2xl font-bold text-black dark:text-white">Article Not Found</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          The article you are looking for does not exist or has been moved.
        </p>
        <Link to="/blog">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Button>
        </Link>
      </div>
    );
  }

  const headings = post.content
    .split('\n')
    .filter((line) => line.startsWith('## '))
    .map((line) => line.replace('## ', ''));

  const renderContent = (content: string) => {
    return content.split('\n\n').map((block, i) => {
      if (block.startsWith('## ')) {
        return (
          <h2
            key={i}
            id={block.replace('## ', '').toLowerCase().replace(/\s+/g, '-')}
            className="mb-4 mt-10 text-2xl font-bold text-black dark:text-white"
          >
            {block.replace('## ', '')}
          </h2>
        );
      }
      if (block.startsWith('### ')) {
        return (
          <h3 key={i} className="mb-3 mt-8 text-xl font-semibold text-black dark:text-white">
            {block.replace('### ', '')}
          </h3>
        );
      }
      if (block.startsWith('- **')) {
        const items = block.split('\n').filter(Boolean);
        return (
          <ul key={i} className="my-4 space-y-2">
            {items.map((li, j) => {
              const text = li.replace(/^- /, '');
              const boldMatch = text.match(/\*\*(.*?)\*\*(.*)/);
              return (
                <li key={j} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  <span>
                    {boldMatch ? (
                      <>
                        <strong className="text-black dark:text-white">{boldMatch[1]}</strong>
                        {boldMatch[2]}
                      </>
                    ) : (
                      text
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        );
      }
      if (block.startsWith('- ')) {
        const items = block.split('\n').filter(Boolean);
        return (
          <ul key={i} className="my-4 space-y-2">
            {items.map((li, j) => (
              <li key={j} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                <span>{li.replace(/^- /, '')}</span>
              </li>
            ))}
          </ul>
        );
      }
      if (block.startsWith('> ')) {
        return (
          <blockquote
            key={i}
            className="my-4 rounded-r-lg border-l-4 border-primary bg-gray-50 py-2 pl-4 italic text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          >
            {block.replace(/^> /gm, '')}
          </blockquote>
        );
      }
      if (block.match(/^\d\. /)) {
        const items = block.split('\n').filter(Boolean);
        return (
          <ol key={i} className="my-4 list-inside list-decimal space-y-2">
            {items.map((li, j) => (
              <li key={j} className="text-gray-700 dark:text-gray-300">
                {li.replace(/^\d\. /, '')}
              </li>
            ))}
          </ol>
        );
      }
      return (
        <p key={i} className="my-4 leading-relaxed text-gray-700 dark:text-gray-300">
          {block}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero */}
      <div className="relative h-[400px] bg-gray-900 overflow-hidden">
        <img src={post.featuredImage} alt={post.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="mx-auto max-w-4xl">
            <Link
              to="/blog"
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/80 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
            <div className="mb-3 flex items-center gap-3">
              <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                {post.category}
              </span>
              <span className="flex items-center gap-1 text-sm text-white/70">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(post.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1 text-sm text-white/70">
                <Clock className="h-3.5 w-3.5" />
                {post.readTime}
              </span>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">{post.title}</h1>
            <p className="text-lg text-primary font-medium">{post.author}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Table of Contents - Sidebar */}
          {headings.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <Card className="dark:bg-gray-900 dark:border-gray-800">
                  <CardContent className="p-5">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Table of Contents
                    </h3>
                    <nav className="space-y-1.5">
                      {headings.map((heading, i) => (
                        <a
                          key={i}
                          href={`#${heading.toLowerCase().replace(/\s+/g, '-')}`}
                          className="block text-sm text-gray-600 transition-colors hover:text-primary dark:text-gray-400 dark:hover:text-primary"
                        >
                          {heading}
                        </a>
                      ))}
                    </nav>
                  </CardContent>
                </Card>
              </div>
            </aside>
          )}

          {/* Main Content */}
          <div className={headings.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <div className="mx-auto max-w-3xl">
              <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                {renderContent(post.content)}
              </div>

              {/* Tags */}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>

              {/* Share */}
              <div className="mt-8 flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Share this article:</span>
                <div className="flex gap-2">
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-primary hover:text-white dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-primary dark:hover:text-white">
                    <Facebook className="h-4 w-4" />
                  </button>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-primary hover:text-white dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-primary dark:hover:text-white">
                    <Twitter className="h-4 w-4" />
                  </button>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-primary hover:text-white dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-primary dark:hover:text-white">
                    <Linkedin className="h-4 w-4" />
                  </button>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-primary hover:text-white dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-primary dark:hover:text-white">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">Related Articles</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((relPost) => (
                <Link key={relPost.id} to={`/blog/${relPost.id}`}>
                  <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                    <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img
                        src={relPost.featuredImage}
                        alt={relPost.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <CardContent className="p-5">
                      <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(relPost.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <h3 className="mb-2 text-lg font-semibold text-black transition-colors group-hover:text-primary dark:text-white">
                        {relPost.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {relPost.excerpt}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
