import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Building2, ArrowRight, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  client: string;
  industry: string;
  excerpt: string;
  image: string;
  results: { metric: string; value: string }[];
  tags: string[];
}

const INDUSTRIES = [
  'All',
  'Food & Beverage',
  'E-Commerce',
  'FMCG',
  'Pharmaceutical',
  'Automotive',
  'Electronics',
];

const caseStudies: CaseStudy[] = [
  {
    id: '1',
    title: 'How Skyline Print Pack Reduced Waste by 40% with Automated Die Cutting',
    slug: 'skyline-print-pack-die-cutting',
    client: 'Skyline Print Pack',
    industry: 'Food & Beverage',
    excerpt:
      'Skyline Print Pack transformed their packaging operations by upgrading to our fully automatic die cutting machine, achieving remarkable improvements in efficiency and waste reduction.',
    image: '/images/products/High-Speed-Automatic-Die-Cutting-and-creasing-machine.png',
    results: [
      { metric: 'Waste Reduction', value: '40%' },
      { metric: 'Production Speed', value: '+60%' },
      { metric: 'ROI Period', value: '8 months' },
    ],
    tags: ['die cutting', 'automation', 'waste reduction'],
  },
  {
    id: '2',
    title: 'Gujarat Corrugators Achieves 3x Output with High-Speed Flute Laminator',
    slug: 'gujarat-corrugators-flute-laminator',
    client: 'Gujarat Corrugators Pvt. Ltd.',
    industry: 'E-Commerce',
    excerpt:
      'By installing our high-speed automatic flute laminator, Gujarat Corrugators tripled their production output while maintaining consistent quality standards.',
    image: '/images/products/high-speed-automatic-flute-laminator.png',
    results: [
      { metric: 'Output Increase', value: '3x' },
      { metric: 'Quality Score', value: '98.5%' },
      { metric: 'Downtime', value: '-70%' },
    ],
    tags: ['flute laminator', 'production increase', 'quality'],
  },
  {
    id: '3',
    title: 'Mumbai Pharma Solutions Streamlines Packaging with Semi-Automatic Die Cutter',
    slug: 'mumbai-pharma-semi-automatic',
    client: 'Mumbai Pharma Solutions',
    industry: 'Pharmaceutical',
    excerpt:
      'Mumbai Pharma Solutions improved their pharmaceutical packaging compliance and efficiency by adopting our semi-automatic die cutting and creasing machine.',
    image: '/images/products/Semi-Automatic-Die-Cutting-&-Creasing-Machine.png',
    results: [
      { metric: 'Compliance', value: '100%' },
      { metric: 'Cost Savings', value: '25%' },
      { metric: 'Setup Time', value: '-50%' },
    ],
    tags: ['pharmaceutical', 'compliance', 'semi-automatic'],
  },
  {
    id: '4',
    title: 'Delhi E-Commerce Hub Scales Packaging with Folder Gluer Investment',
    slug: 'delhi-ecommerce-folder-gluer',
    client: 'PackRight Solutions',
    industry: 'E-Commerce',
    excerpt:
      'PackRight Solutions in Delhi scaled their packaging operations to handle peak season volumes by investing in our high-speed automatic folder gluer machine.',
    image: '/images/products/Automatic-folder-gluer.png',
    results: [
      { metric: 'Peak Capacity', value: '+200%' },
      { metric: 'Labor Cost', value: '-35%' },
      { metric: 'Box Quality', value: '99.2%' },
    ],
    tags: ['folder gluer', 'e-commerce', 'scaling'],
  },
  {
    id: '5',
    title: 'Pune Automotive Parts Achieves Precision Packaging with NC Cutter',
    slug: 'pune-automotive-nc-cutter',
    client: 'AutoPack Industries',
    industry: 'Automotive',
    excerpt:
      'AutoPack Industries in Pune achieved precision packaging for sensitive automotive parts using our NC Cutter machine, eliminating damage during transit.',
    image: '/images/products/nc-cutter-machine.jpeg',
    results: [
      { metric: 'Damage Rate', value: '-95%' },
      { metric: 'Cut Precision', value: '0.1mm' },
      { metric: 'Throughput', value: '+45%' },
    ],
    tags: ['NC cutter', 'automotive', 'precision'],
  },
  {
    id: '6',
    title: 'Bangalore Electronics Brand Elevates Packaging with Rotary Printer',
    slug: 'bangalore-electronics-rotary-printer',
    client: 'TechPack India',
    industry: 'Electronics',
    excerpt:
      'TechPack India elevated their product packaging with vibrant, high-quality printing using our rotary printer, enhancing brand perception significantly.',
    image: '/images/products/rottery-printer-RS-4.jpeg',
    results: [
      { metric: 'Brand Perception', value: '+80%' },
      { metric: 'Print Speed', value: '+55%' },
      { metric: 'Color Accuracy', value: '99%' },
    ],
    tags: ['rotary printer', 'electronics', 'branding'],
  },
];

const industryColors: Record<string, string> = {
  'Food & Beverage': 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  'E-Commerce': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  FMCG: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  Pharmaceutical: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  Automotive: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  Electronics: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
};

export function CaseStudiesPage() {
  const [search, setSearch] = useState('');
  const [activeIndustry, setActiveIndustry] = useState('All');

  const filteredStudies = useMemo(() => {
    return caseStudies.filter((study) => {
      const matchesIndustry = activeIndustry === 'All' || study.industry === activeIndustry;
      const matchesSearch =
        !search ||
        study.title.toLowerCase().includes(search.toLowerCase()) ||
        study.client.toLowerCase().includes(search.toLowerCase()) ||
        study.excerpt.toLowerCase().includes(search.toLowerCase());
      return matchesIndustry && matchesSearch;
    });
  }, [search, activeIndustry]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-black dark:text-white">Case Studies</h1>
        <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-400">
          Discover how our clients across various industries have transformed their packaging operations with Bark Technologies machinery.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Search case studies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {INDUSTRIES.map((industry) => (
            <Button
              key={industry}
              variant={activeIndustry === industry ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveIndustry(industry)}
              className="whitespace-nowrap dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {industry}
            </Button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        {filteredStudies.length} case stud{filteredStudies.length !== 1 ? 'ies' : 'y'} found
        {activeIndustry !== 'All' && ` in "${activeIndustry}"`}
      </p>

      {/* Case Studies Grid */}
      {filteredStudies.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStudies.map((study) => (
            <Link key={study.id} to={`/case-studies/${study.id}`}>
              <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={study.image}
                    alt={study.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium ${industryColors[study.industry] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                  >
                    {study.industry}
                  </span>
                </div>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Building2 className="h-3.5 w-3.5" />
                    {study.client}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-black transition-colors group-hover:text-primary dark:text-white line-clamp-2">
                    {study.title}
                  </h3>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {study.excerpt}
                  </p>

                  {/* Results */}
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {study.results.map((result, i) => (
                      <div key={i} className="text-center">
                        <p className="text-lg font-bold text-primary">{result.value}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                          {result.metric}
                        </p>
                      </div>
                    ))}
                  </div>

                  <span className="flex items-center gap-1 text-sm font-medium text-primary">
                    Read Full Case Study
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-500 dark:text-gray-400">
          <Search className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No case studies match your search criteria.</p>
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 rounded-xl bg-primary/5 border border-primary/20 p-8 text-center">
        <TrendingUp className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h2 className="mb-2 text-xl font-bold text-black dark:text-white">Want Similar Results?</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Let us help you achieve the same success with our packaging machinery solutions.
        </p>
        <a href="tel:+918810597980">
          <Button size="lg" className="gap-2">
            Contact Us for a Consultation
            <ArrowRight className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </div>
  );
}
