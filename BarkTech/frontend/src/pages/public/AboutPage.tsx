import { Award, Users, Globe, TrendingUp, MapPin, Phone, Mail, Zap, HeartHandshake, Headphones } from 'lucide-react';

const productRange = [
  'Automatic Die Cutting & Creasing Machine',
  'High-Speed Automatic Die Cutting & Creasing Machine',
  'Semi-Automatic Die Cutting & Creasing Machine',
  'Automatic Flute Laminator Machine',
  'Automatic Window Patching Machine',
  'High-Speed Automatic Flute Laminator Machine',
  'Semi-Automatic Flute Laminator Machine',
  'Semi-Automatic Stitching Machine',
  'Rotary Printer (RS-4) Machine',
  'Electric Mill Roll Stand',
  'NC Cutter Machine',
  'Single Facer Machine',
];

const whyChooseUs = [
  {
    icon: Globe,
    title: 'Nationwide Presence',
    desc: 'With successful installations across India, we have built a reputation as a reliable partner in the packaging industry, serving cities like Ahmedabad, Noida, Pune, Meerut, Agra, Baroda, Thane, Chennai, Bengaluru, Ghaziabad, and more.',
  },
  {
    icon: Zap,
    title: 'Quality & Innovation',
    desc: 'We provide top-of-the-line machinery that meets international standards. Whether you are looking for high-speed machines for large-scale production or specialized semi-automatic options, we have the perfect solution for you.',
  },
  {
    icon: Headphones,
    title: 'Expert Team Support',
    desc: 'Our skilled and experienced team ensures smooth installation, regular maintenance, and reliable after-sales support, so your operations stay hassle-free. We also provide machine repair services to keep your equipment running smoothly, no matter where you are located.',
  },
  {
    icon: HeartHandshake,
    title: 'Customer-Centric Approach',
    desc: 'We understand that each business has unique needs. That is why we offer customized solutions that drive growth and boost operational efficiency.',
  },
];

const offices = [
  {
    title: 'Head Office',
    location: 'Ghaziabad',
    address: 'SF-03, Local Shopping Complex, Shushat Aquapolis, Ghaziabad',
    phone: '+91 8810597980',
    email: 'info@barktechnologies.in',
  },
  {
    title: 'Spare Branch Office',
    location: 'Noida',
    address: 'F-41, 1st Floor, Sec 9, Noida 201301, UP, India',
    phone: '+91 9266244587',
    email: 'info@barktechnologies.in',
  },
  {
    title: 'Service Accommodation',
    location: 'Ahmedabad & Vadodara',
    address: 'SF-03, Aquapolis',
    phone: '+91 9266244587',
    email: 'info@barktechnologies.in',
  },
];

export function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-muted-foreground">
        <span>Home</span>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">About Us</span>
      </nav>

      {/* Hero */}
      <div className="mb-16 text-center">
        <h1 className="text-3xl font-bold">About Us &ndash; Bark Technologies</h1>
        <p className="mt-6 max-w-3xl mx-auto text-muted-foreground leading-relaxed">
          Welcome to Bark Technologies &mdash; your trusted partner in providing innovative and
          high-quality packaging machines and solutions across India. With years of experience in
          the packaging industry, we are proud to have successfully installed over 100+ machines in
          major cities including Ahmedabad, Noida, Pune, Meerut, Agra, Baroda, Thane, Chennai,
          Bengaluru, Ghaziabad, and more.
        </p>
        <p className="mt-4 max-w-3xl mx-auto text-muted-foreground leading-relaxed">
          At Bark Technologies, we specialize in a wide range of packaging machines designed to meet
          the unique needs of today&rsquo;s packaging industry. From high-speed machinery to more
          specialized solutions, we ensure our clients have access to the latest technology for
          maximum productivity, efficiency, and cost-effectiveness. In addition to supplying
          machines, we also provide service, support, and machine repairs across all cities we
          operate in, ensuring your business stays up and running without interruption.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-16">
        <div className="text-center p-6 rounded-xl bg-card text-card-foreground border border-border">
          <Users className="mx-auto h-8 w-8 text-primary mb-3" />
          <div className="text-2xl font-bold">100+</div>
          <div className="text-sm text-muted-foreground mt-1">Machines Installed</div>
        </div>
        <div className="text-center p-6 rounded-xl bg-card text-card-foreground border border-border">
          <Globe className="mx-auto h-8 w-8 text-primary mb-3" />
          <div className="text-2xl font-bold">10+</div>
          <div className="text-sm text-muted-foreground mt-1">Cities Served</div>
        </div>
        <div className="text-center p-6 rounded-xl bg-card text-card-foreground border border-border">
          <Award className="mx-auto h-8 w-8 text-primary mb-3" />
          <div className="text-2xl font-bold">Since 2019</div>
          <div className="text-sm text-muted-foreground mt-1">Trusted Service</div>
        </div>
        <div className="text-center p-6 rounded-xl bg-card text-card-foreground border border-border">
          <TrendingUp className="mx-auto h-8 w-8 text-primary mb-3" />
          <div className="text-xs sm:text-sm font-bold leading-tight">UDYAM-UP-28-0004163</div>
          <div className="text-sm text-muted-foreground mt-1">Licensed Company</div>
        </div>
      </div>

      {/* Product Range */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Our Product Range Includes:</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {productRange.map((product, i) => (
            <div key={product} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-sm text-card-foreground">{product}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Why Choose Bark Technologies?</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {whyChooseUs.map((item) => (
            <div key={item.title} className="p-6 rounded-xl bg-card text-card-foreground border border-border">
              <div className="flex items-center gap-3 mb-3">
                <item.icon className="h-5 w-5 text-primary flex-shrink-0" />
                <h3 className="font-semibold text-lg">{item.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Our Offices */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Our Offices</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {offices.map((office) => (
            <div key={office.title} className="p-6 rounded-xl bg-card text-card-foreground border border-border">
              <h3 className="font-semibold text-lg mb-1">{office.title}</h3>
              <p className="text-primary text-sm font-medium mb-4">Location: {office.location}</p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                  <span>{office.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                  <a href={`tel:${office.phone.replace(/\s/g, '')}`} className="hover:text-primary transition-colors">
                    {office.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                  <a href={`mailto:${office.email}`} className="hover:text-primary transition-colors">
                    {office.email}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Online Support */}
      <div className="mb-16 p-8 rounded-xl bg-card text-card-foreground border border-border">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <Headphones className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">Online Support</h2>
            </div>
            <p className="text-muted-foreground text-sm">24 hours online support for our customers.</p>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-2">
            <a
              href="tel:+918810597980"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              <Phone className="h-4 w-4" />
              +91 8810597980
            </a>
          </div>
        </div>
      </div>

      {/* Highlight Bar */}
      <div className="bg-primary text-primary-foreground rounded-xl p-8 text-center">
        <p className="text-lg font-semibold leading-relaxed">
          We Provide A High Quality Service In India As Well As Neighbouring Countries With Trust Since 2019
        </p>
        <p className="mt-3 text-primary-foreground/80">
          Office Address: SF-03, Local Shopping Complex, Shushat Aquapolis, Ghaziabad &ndash; 201009, Uttar Pradesh (India)
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm text-primary-foreground/80">
          <span className="flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" />
            +91 8810597980
          </span>
          <span className="flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            service@barktechnologies.in
          </span>
          <span className="flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            sales1@barktechnologies.in
          </span>
        </div>
      </div>
    </div>
  );
}
