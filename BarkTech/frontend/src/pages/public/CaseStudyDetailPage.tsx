import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Calendar, Share2, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface CaseStudyDetail {
  id: string;
  title: string;
  client: string;
  industry: string;
  location: string;
  date: string;
  image: string;
  problem: string;
  solution: string;
  results: { metric: string; value: string; description: string }[];
  testimonial: { quote: string; author: string; role: string };
  tags: string[];
}

const caseStudyDetails: Record<string, CaseStudyDetail> = {
  '1': {
    id: '1',
    title: 'How Skyline Print Pack Reduced Waste by 40% with Automated Die Cutting',
    client: 'Skyline Print Pack',
    industry: 'Food & Beverage',
    location: 'Ghaziabad, Uttar Pradesh',
    date: '2026-06-01',
    image: '/images/products/High-Speed-Automatic-Die-Cutting-and-creasing-machine.png',
    problem:
      'Skyline Print Pack was struggling with high material waste (over 15%) and inconsistent cut quality using their aging manual die cutting equipment. With growing orders from food and beverage clients demanding tighter tolerances, they needed a solution that could deliver precision at scale without increasing labor costs.',
    solution:
      'We recommended our High-Speed Automatic Die Cutting and Creasing Machine, which features CNC-controlled precision cutting, automated sheet feeding, and integrated waste removal. The machine was installed with full operator training and a preventive maintenance program.',
    results: [
      { metric: 'Waste Reduction', value: '40%', description: 'Material waste dropped from 15% to under 9%' },
      { metric: 'Production Speed', value: '+60%', description: 'Daily output increased from 5,000 to 8,000 sheets' },
      { metric: 'ROI Period', value: '8 months', description: 'Full return on investment in under a year' },
      { metric: 'Quality Consistency', value: '99.1%', description: 'Near-zero defect rate on die-cut products' },
    ],
    testimonial: {
      quote: 'The investment in Bark Technologies\' die cutting machine has transformed our business. We\'re producing more, wasting less, and our customers are happier than ever. The installation team was professional and the training was thorough.',
      author: 'Rajesh Kumar',
      role: 'Managing Director, Skyline Print Pack',
    },
    tags: ['die cutting', 'automation', 'waste reduction', 'food packaging'],
  },
  '2': {
    id: '2',
    title: 'Gujarat Corrugators Achieves 3x Output with High-Speed Flute Laminator',
    client: 'Gujarat Corrugators Pvt. Ltd.',
    industry: 'E-Commerce',
    location: 'Morbi, Gujarat',
    date: '2026-05-15',
    image: '/images/products/high-speed-automatic-flute-laminator.png',
    problem:
      'Gujarat Corrugators was turning away orders during peak seasons due to limited production capacity. Their semi-automatic flute laminator couldn\'t keep up with the demand from e-commerce clients who needed quick turnaround times on corrugated packaging.',
    solution:
      'We installed our High-Speed Automatic Flute Laminator with integrated vision-guided registration system. The machine features automated liner feeding, precision bonding, and quality inspection — enabling unattended operation for extended shifts.',
    results: [
      { metric: 'Output Increase', value: '3x', description: 'Daily production tripled from 10,000 to 30,000 sheets' },
      { metric: 'Quality Score', value: '98.5%', description: 'Registration accuracy within 0.5mm tolerance' },
      { metric: 'Downtime', value: '-70%', description: 'Automated maintenance alerts reduced unplanned stops' },
      { metric: 'Client Retention', value: '100%', description: 'No clients lost due to capacity constraints' },
    ],
    testimonial: {
      quote: 'The high-speed flute laminator from Bark Technologies was a game-changer for us. We went from turning away business to welcoming new clients. The quality is exceptional and the machine runs like clockwork.',
      author: 'Prakash Patel',
      role: 'Production Head, Gujarat Corrugators Pvt. Ltd.',
    },
    tags: ['flute laminator', 'production increase', 'quality', 'e-commerce'],
  },
};

export function CaseStudyDetailPage() {
  const { id } = useParams();
  const study = caseStudyDetails[id || ''];

  const relatedStudies = Object.values(caseStudyDetails).filter(
    (s) => s.id !== id && s.industry === study?.industry
  ).slice(0, 2);

  if (!study) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="mb-4 text-2xl font-bold text-black dark:text-white">Case Study Not Found</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          The case study you are looking for does not exist or has been moved.
        </p>
        <Link to="/case-studies">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" /> Back to Case Studies
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero */}
      <div className="relative h-[400px] bg-gray-900 overflow-hidden">
        <img src={study.image} alt={study.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="mx-auto max-w-4xl">
            <Link
              to="/case-studies"
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/80 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Case Studies
            </Link>
            <div className="mb-3 flex items-center gap-3">
              <StatusBadge status={study.industry === 'E-Commerce' ? 'active' : 'published'} />
              <span className="flex items-center gap-1 text-sm text-white/70">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(study.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">{study.title}</h1>
            <div className="flex items-center gap-4 text-sm text-white/70">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {study.client}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {study.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Results Overview */}
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-bold text-black dark:text-white">Key Results</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {study.results.map((result, i) => (
                    <div key={i} className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800">
                      <p className="text-2xl font-bold text-primary">{result.value}</p>
                      <p className="mt-1 text-xs font-medium text-black dark:text-white">{result.metric}</p>
                      <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">{result.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* The Challenge */}
            <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-xl font-bold text-black dark:text-white">The Challenge</h2>
              <p className="leading-relaxed text-gray-700 dark:text-gray-300">{study.problem}</p>
            </div>

            {/* Our Solution */}
            <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-xl font-bold text-black dark:text-white">Our Solution</h2>
              <p className="leading-relaxed text-gray-700 dark:text-gray-300">{study.solution}</p>
            </div>

            {/* Testimonial */}
            {study.testimonial && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-8">
                <Quote className="mb-4 h-8 w-8 text-primary/40" />
                <blockquote className="mb-4 text-lg italic text-gray-700 dark:text-gray-300 leading-relaxed">
                  &ldquo;{study.testimonial.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-bold text-sm">
                    {study.testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-black dark:text-white">{study.testimonial.author}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{study.testimonial.role}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Share */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Share this case study:</span>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-primary hover:text-white dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-primary dark:hover:text-white">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-6">
                <h3 className="mb-4 font-bold text-black dark:text-white">Client Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Client</span>
                    <span className="font-medium text-black dark:text-white">{study.client}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Industry</span>
                    <span className="font-medium text-black dark:text-white">{study.industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Location</span>
                    <span className="font-medium text-black dark:text-white">{study.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Date</span>
                    <span className="font-medium text-black dark:text-white">
                      {new Date(study.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-6">
                <h3 className="mb-3 font-bold text-black dark:text-white">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {study.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact CTA */}
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-6">
                <h3 className="mb-3 font-bold text-black dark:text-white">Achieve Similar Results</h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Get in touch to learn how our solutions can transform your packaging operations.
                </p>
                <a href="tel:+918810597980">
                  <Button className="w-full gap-2">
                    Contact Our Team
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Related Case Studies */}
            {relatedStudies.length > 0 && (
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardContent className="p-6">
                  <h3 className="mb-4 font-bold text-black dark:text-white">Related Case Studies</h3>
                  <div className="space-y-4">
                    {relatedStudies.map((rel) => (
                      <Link key={rel.id} to={`/case-studies/${rel.id}`} className="flex gap-3 group">
                        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img src={rel.image} alt={rel.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{rel.client}</p>
                          <p className="text-sm font-medium text-black dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                            {rel.title}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
