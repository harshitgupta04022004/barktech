import { useState, useMemo } from 'react';
import { Search, Phone, MessageCircle, ArrowRight, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'What types of packaging machinery does Bark Technologies offer?',
    answer: 'We offer a comprehensive range of packaging machinery including die cutting and creasing machines (semi-automatic and fully automatic), flute laminators (semi-automatic and high-speed automatic), folder gluers, window patching machines, printing machines, and corrugation equipment. Our product line covers the entire packaging production workflow.',
    category: 'Products',
  },
  {
    id: '2',
    question: 'Do you provide installation and training services?',
    answer: 'Yes, we provide complete installation and training services. Our experienced engineers will install the machine at your facility, calibrate it for optimal performance, and provide comprehensive operator and maintenance training. We also offer post-installation support and service contracts.',
    category: 'Services',
  },
  {
    id: '3',
    question: 'What is the typical lead time for machine delivery?',
    answer: 'Lead times vary depending on the specific machine and your location. Standard machines are typically available within 2-4 weeks. Custom configurations may take 4-8 weeks. We will provide a specific delivery timeline when you place your order.',
    category: 'Orders',
  },
  {
    id: '4',
    question: 'Do you offer financing options for machinery purchases?',
    answer: 'Yes, we work with several financial institutions to offer flexible financing options including EMI plans, lease-to-own programs, and equipment loans. Contact our sales team to discuss the best financing option for your business.',
    category: 'Orders',
  },
  {
    id: '5',
    question: 'What after-sales support do you provide?',
    answer: 'We provide comprehensive after-sales support including warranty coverage (typically 1 year), preventive maintenance programs, spare parts availability, remote technical support, and on-site service visits. Our service team is available during business hours and for emergencies.',
    category: 'Services',
  },
  {
    id: '6',
    question: 'Can I schedule a machine demonstration before purchasing?',
    answer: 'Absolutely! We encourage all potential customers to see our machines in action. You can visit our facility for a live demonstration, or we can arrange a virtual demo. Contact us to schedule a visit at a time that works for you.',
    category: 'Products',
  },
  {
    id: '7',
    question: 'What materials can your die cutting machines handle?',
    answer: 'Our die cutting machines can handle a wide range of materials including corrugated board (single wall, double wall, triple wall), paperboard, cardstock, EVA foam, gasket materials, leather, and various laminated materials. The specific capability depends on the machine model and configuration.',
    category: 'Products',
  },
  {
    id: '8',
    question: 'Do you offer spare parts and consumables?',
    answer: 'Yes, we maintain a comprehensive inventory of spare parts and consumables including cutting dies, creasing matrices, patching tape, glue rollers, rubber mats, and more. Most spare parts can be shipped within 24-48 hours within India.',
    category: 'Services',
  },
  {
    id: '9',
    question: 'What is the warranty on your machines?',
    answer: 'All our machines come with a standard 1-year warranty covering manufacturing defects and component failures. Extended warranty options are available. The warranty includes parts replacement and on-site service support.',
    category: 'Orders',
  },
  {
    id: '10',
    question: 'How do I choose the right machine for my business?',
    answer: 'Our technical team can help you select the right machine based on your production volume, material types, budget, and specific requirements. We recommend contacting us for a free consultation where we assess your needs and recommend the optimal solution.',
    category: 'Products',
  },
  {
    id: '11',
    question: 'Where are your offices and service centers located?',
    answer: 'Our headquarters is in Ghaziabad, near Delhi NCR. We have service centers across India including locations in Maharashtra, Gujarat, Karnataka, and Tamil Nadu. Our service network covers all major industrial regions.',
    category: 'Services',
  },
  {
    id: '12',
    question: 'Do you export machines internationally?',
    answer: 'Yes, we export our machinery to several countries across Asia, Africa, and the Middle East. We have experience with international shipping, customs documentation, and overseas installation support.',
    category: 'Orders',
  },
];

const FAQ_CATEGORIES = ['All', 'Products', 'Services', 'Orders'];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-primary"
      >
        <span className="text-base font-medium text-black dark:text-white pr-4">{item.question}</span>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-96 pb-5' : 'max-h-0'
        }`}
      >
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{item.answer}</p>
      </div>
    </div>
  );
}

export function FAQPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredFAQs = useMemo(() => {
    return faqData.filter((faq) => {
      const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
      const matchesSearch =
        !search ||
        faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-black dark:text-white sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600 dark:text-gray-400">
            Find answers to common questions about our products, services, and support. Can't find what you're looking for? Contact our team.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 dark:bg-gray-800 dark:border-gray-600"
          />
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
          {FAQ_CATEGORIES.map((cat) => (
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

        {/* FAQ List */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="p-0 divide-y-0">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq) => (
                <FAQAccordion key={faq.id} item={faq} />
              ))
            ) : (
              <div className="py-16 text-center text-gray-500 dark:text-gray-400">
                <Search className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No questions match your search criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Still have questions CTA */}
        <div className="mt-12 rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-2 text-xl font-bold text-black dark:text-white">Still Have Questions?</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Our team is here to help. Reach out to us and we'll get back to you as soon as possible.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href="tel:+918810597980">
              <Button size="lg" className="gap-2">
                <Phone className="h-4 w-4" />
                Call: +91 8810597980
              </Button>
            </a>
            <a href="https://wa.me/918810597980" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="gap-2 dark:border-gray-600 dark:text-gray-200">
                <MessageCircle className="h-4 w-4" />
                WhatsApp Us
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
