import { Link } from 'react-router-dom';
import { Newspaper, Calendar, ArrowRight, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const newsItems = [
  {
    id: 1,
    title: 'Our Latest Consignment is Being Loaded into Containers!',
    subtitle: 'Sheet Cutter / NC Cutter Machine — Upcoming to India',
    date: '2023-09-16',
    image: '/images/news-images/166.png',
    excerpt: 'Big News! Our latest consignment is being loaded into containers, featuring a high-performance Sheet Cutter/NC Cutter Machine, en route from China to India! This cutting-edge machine is a game-changer in precision cutting, designed to elevate your production processes.',
    category: 'Consignment',
  },
  {
    id: 2,
    title: 'Our Latest Consignment is Being Loaded into Containers!',
    subtitle: 'Single Color Flexo Machine — Upcoming to India',
    date: '2023-09-16',
    image: '/images/news-images/16.png',
    excerpt: 'Big News! Our latest consignment is being loaded into containers, featuring a high-performance Single Color Flexo Machine, en route from China to India! This machine delivers vibrant single-color flexographic printing for packaging and labeling applications.',
    category: 'Consignment',
  },
  {
    id: 3,
    title: 'Our Latest Consignment is Being Loaded into Containers!',
    subtitle: 'Semi Automatic Die Machine — Upcoming to India',
    date: '2023-08-29',
    image: '/images/news-images/29.mp4',
    isVideo: true,
    excerpt: 'Big News! Our latest consignment is being loaded into containers, featuring a high-performance Semi Automatic Die Cutting Machine, en route from China to India! This machine combines manual precision with automated efficiency for die cutting operations.',
    category: 'Consignment',
  },
  {
    id: 4,
    title: 'Installation and Updates!',
    subtitle: 'Automatic Flute Laminator Machine — Successful Installation in Gujarat',
    date: '2023-08-08',
    image: '/images/news-images/gujrat.png',
    excerpt: 'Successful installation of our new Automatic Flute Laminator Machine in Morbi, Gujarat. Experience the cutting-edge technology that elevates packaging solutions to new heights! This installation marks another milestone in our expanding presence across India.',
    category: 'Installation',
  },
];

const categoryColors: Record<string, string> = {
  Consignment: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Installation: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  Events: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'Company News': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  'Product Launch': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
};

export function NewsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Newspaper className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold dark:text-white">News & Updates</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
          Stay updated with the latest from Bark Technologies — new consignments, installations, product arrivals, and company milestones.
        </p>
      </div>

      <div className="space-y-6">
        {newsItems.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Image / Video */}
                <div className="w-full md:w-72 flex-shrink-0 bg-gray-100 dark:bg-gray-800 relative">
                  {item.isVideo ? (
                    <div className="relative aspect-video md:aspect-auto md:h-full">
                      <video
                        src={item.image}
                        className="w-full h-full object-cover"
                        controls
                        muted
                        poster="/images/news-images/29.mp4"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg">
                          <Play className="h-5 w-5 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full aspect-video md:aspect-auto md:h-full object-cover"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[item.category] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                      {item.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-1 text-black dark:text-white">{item.title}</h3>
                  <p className="text-sm font-medium text-primary mb-2">{item.subtitle}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.excerpt}</p>
                  <Link to={`/news/${item.id}`} className="mt-4 inline-flex items-center gap-1 text-sm text-primary font-medium hover:gap-2 transition-all">
                    Read More
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Want to stay updated with our latest arrivals?</p>
        <a href="tel:+918810597980">
          <Button size="lg" className="gap-2">
            Contact Us for More Information
            <ArrowRight className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </div>
  );
}
