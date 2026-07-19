import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Calendar, Phone, ArrowRight, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface Installation {
  id: string;
  title: string;
  machine: string;
  client: string;
  location: string;
  state: string;
  date: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  image: string;
  description: string;
  machineType: string;
}

const STATUS_FILTERS = ['All', 'completed', 'in-progress', 'upcoming'] as const;

const installations: Installation[] = [
  {
    id: '1',
    title: 'Automatic Flute Laminator Installation',
    machine: 'High-Speed Automatic Flute Laminator',
    client: 'Gujarat Corrugators Pvt. Ltd.',
    location: 'Morbi',
    state: 'Gujarat',
    date: '2026-07-10',
    status: 'completed',
    image: '/images/products/high-speed-automatic-flute-laminator.png',
    description:
      'Complete installation and commissioning of high-speed automatic flute laminator with vision-guided registration. Includes operator training and preventive maintenance setup.',
    machineType: 'Flute Laminator',
  },
  {
    id: '2',
    title: 'Semi-Automatic Die Cutter Setup',
    machine: 'Semi-Automatic Die Cutting & Creasing Machine',
    client: 'Mumbai Pharma Solutions',
    location: 'Mumbai',
    state: 'Maharashtra',
    date: '2026-06-25',
    status: 'completed',
    image: '/images/products/Semi-Automatic-Die-Cutting-&-Creasing-Machine.png',
    description:
      'Installation of semi-automatic die cutting and creasing machine for pharmaceutical packaging. Full calibration for GMP-compliant packaging materials.',
    machineType: 'Die Cutting',
  },
  {
    id: '3',
    title: 'NC Cutter Machine Installation',
    machine: 'NC Cutter Machine',
    client: 'AutoPack Industries',
    location: 'Pune',
    state: 'Maharashtra',
    date: '2026-06-15',
    status: 'completed',
    image: '/images/products/nc-cutter-machine.jpeg',
    description:
      'Precision NC Cutter installation for automotive component packaging. Includes CAD/CAM integration setup and operator certification program.',
    machineType: 'NC Cutter',
  },
  {
    id: '4',
    title: 'Folder Gluer Line Setup',
    machine: 'Automatic Folder Gluer Machine',
    client: 'PackRight Solutions',
    location: 'Delhi NCR',
    state: 'Delhi',
    date: '2026-07-18',
    status: 'in-progress',
    image: '/images/products/Automatic-folder-gluer.png',
    description:
      'Currently installing a complete automatic folder gluer line including pre-folding, gluing, and quality inspection stations. Expected completion within the week.',
    machineType: 'Folder Gluer',
  },
  {
    id: '5',
    title: 'Rotary Printer Installation',
    machine: 'Rotary Printer RS-4',
    client: 'TechPack India',
    location: 'Bangalore',
    state: 'Karnataka',
    date: '2026-07-20',
    status: 'in-progress',
    image: '/images/products/rottery-printer-RS-4.jpeg',
    description:
      'Installing a 4-color rotary printer for electronics packaging. Includes ink kitchen setup, color calibration, and production line integration.',
    machineType: 'Printing',
  },
  {
    id: '6',
    title: 'Complete Packaging Line',
    machine: 'Die Cutter + Laminator + Folder Gluer',
    client: 'Future Pack Solutions',
    location: 'Ahmedabad',
    state: 'Gujarat',
    date: '2026-08-05',
    status: 'upcoming',
    image: '/images/5.jpg',
    description:
      'Upcoming complete packaging line installation including die cutting, flute lamination, and folder gluer machines. Full turnkey solution with conveyor integration.',
    machineType: 'Complete Line',
  },
  {
    id: '7',
    title: 'Die Cutting Machine Upgrade',
    machine: 'Fully Automatic Die Cutting Machine',
    client: 'National Carton Industries',
    location: 'Chennai',
    state: 'Tamil Nadu',
    date: '2026-08-15',
    status: 'upcoming',
    image: '/images/products/automatic-die-cutting-and-creasing.png',
    description:
      'Scheduled installation of fully automatic die cutting machine to replace existing manual equipment. Includes production line redesign and staff retraining.',
    machineType: 'Die Cutting',
  },
  {
    id: '8',
    title: 'Semi-Automatic Flute Laminator',
    machine: 'Semi-Automatic Flute Laminator',
    client: 'Eastern Packagers Ltd.',
    location: 'Kolkata',
    state: 'West Bengal',
    date: '2026-06-05',
    status: 'completed',
    image: '/images/products/semi-automatic-flute-laminator.png',
    description:
      'Successful installation of semi-automatic flute laminator for a Kolkata-based packaging manufacturer. Includes glue system setup and quality testing.',
    machineType: 'Flute Laminator',
  },
];

const statusLabels: Record<string, string> = {
  completed: 'Completed',
  'in-progress': 'In Progress',
  upcoming: 'Upcoming',
};

export function InstallationsPage() {
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');

  const filteredInstallations = useMemo(() => {
    return installations.filter((inst) => {
      const matchesStatus = activeStatus === 'All' || inst.status === activeStatus;
      const matchesSearch =
        !search ||
        inst.title.toLowerCase().includes(search.toLowerCase()) ||
        inst.client.toLowerCase().includes(search.toLowerCase()) ||
        inst.location.toLowerCase().includes(search.toLowerCase()) ||
        inst.machine.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [search, activeStatus]);

  const stats = useMemo(() => {
    return {
      completed: installations.filter((i) => i.status === 'completed').length,
      inProgress: installations.filter((i) => i.status === 'in-progress').length,
      upcoming: installations.filter((i) => i.status === 'upcoming').length,
      total: installations.length,
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <Wrench className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-black dark:text-white">Our Installations</h1>
          </div>
          <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-400">
            See where our machinery is making an impact across India. From single machines to complete packaging lines, we deliver and install solutions that drive production.
          </p>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800">
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Installations</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4 text-center dark:bg-amber-900/20">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.inProgress}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-900/20">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.upcoming}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Upcoming</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Search & Filter */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search installations by client, location, or machine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 dark:bg-gray-800 dark:border-gray-600"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUS_FILTERS.map((status) => (
              <Button
                key={status}
                variant={activeStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveStatus(status)}
                className="whitespace-nowrap capitalize dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {status === 'All' ? 'All' : statusLabels[status]}
              </Button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          {filteredInstallations.length} installation{filteredInstallations.length !== 1 ? 's' : ''} found
        </p>

        {/* Installations Grid */}
        {filteredInstallations.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredInstallations.map((inst) => (
              <Card
                key={inst.id}
                className="group overflow-hidden transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={inst.image}
                    alt={inst.machine}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute right-3 top-3">
                    <StatusBadge status={inst.status} />
                  </div>
                </div>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {inst.machineType}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-black transition-colors group-hover:text-primary dark:text-white">
                    {inst.machine}
                  </h3>
                  <p className="mb-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {inst.description}
                  </p>
                  <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-black dark:text-white">{inst.client}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      {inst.location}, {inst.state}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(inst.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-500 dark:text-gray-400">
            <Search className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No installations match your search criteria.</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-xl bg-primary/5 border border-primary/20 p-8 text-center">
          <h2 className="mb-2 text-xl font-bold text-black dark:text-white">Ready to Start Your Installation?</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Our team handles everything from delivery to setup to training. Get in touch to discuss your requirements.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href="tel:+918810597980">
              <Button size="lg" className="gap-2">
                <Phone className="h-4 w-4" />
                Call: +91 8810597980
              </Button>
            </a>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="gap-2 dark:border-gray-600 dark:text-gray-200">
                Request a Quote
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
