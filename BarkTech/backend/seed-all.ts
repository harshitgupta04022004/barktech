/**
 * Bark Technologies — Simplified Database Seed Script
 * Run from BarkTech/backend/: npx tsx seed-all.ts
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/BarkTech';
const MONGODB_DB = process.env.MONGODB_DB_NAME || 'BarkTech';

const categories = [
  { name: 'Die Cutting & Creasing', slug: 'die-cutting', sortOrder: 1, isActive: true },
  { name: 'Flute Laminating', slug: 'laminating', sortOrder: 2, isActive: true },
  { name: 'Window Patching', slug: 'window-patching', sortOrder: 3, isActive: true },
  { name: 'Printing', slug: 'printing', sortOrder: 4, isActive: true },
  { name: 'Cutting', slug: 'cutting', sortOrder: 5, isActive: true },
  { name: 'Corrugating', slug: 'corrugating', sortOrder: 6, isActive: true },
  { name: 'Material Handling', slug: 'material-handling', sortOrder: 7, isActive: true },
  { name: 'Creasing Matrix', slug: 'creasing-matrix', sortOrder: 8, isActive: true },
  { name: 'Folder Gluing', slug: 'folder-gluing', sortOrder: 9, isActive: true },
  { name: 'Pasting', slug: 'pasting', sortOrder: 10, isActive: true },
];

const products = [
  {
    name: 'Automatic Die Cutting And Creasing Machine',
    slug: 'automatic-die-cutting-and-creasing',
    catSlug: 'die-cutting',
    summary: 'Special equipment for die-cutting of advanced coloured boxes. 350 Tons pressure, 5000 sheets/hour.',
    shortDescription: 'Special equipment for die-cutting of advanced coloured boxes made of paper and paper board.',
    description: 'Automatic Die Cutting And Creasing Machine, fitted with creasing dies and side wheel adjustment for increasing and decreasing the height as per requirement. Special equipment for die-cutting of advanced coloured boxes made of paper and paper board.',
    specs: [
      { key: 'Model', value: 'MY-1500A' },
      { key: 'Max. Paper Size', value: '1500x1105mm' },
      { key: 'Max. Pressure', value: '350 Tons' },
      { key: 'Max. Cutting Speed', value: '5000 sheets/h' },
      { key: 'Die-Cutting Precision', value: '±0.18mm' },
      { key: 'Total Power', value: '20 KW' },
      { key: 'Weight', value: '20 Tons' },
    ],
    media: [{ url: '/images/product/automatic-die-cutting-and-creasing.png', alt: 'Automatic Die Cutting And Creasing Machine' }],
    published: true,
    reviewStatus: 'approved',
    isFeatured: true,
  },
  {
    name: 'High Speed Automatic Die Cutting & Creasing Machine',
    slug: 'high-speed-die-cutting',
    catSlug: 'die-cutting',
    summary: 'High-speed die cutting machine with up to 10000 sheets/hour cutting speed.',
    shortDescription: 'High-speed die cutting machine with up to 10000 sheets/hour cutting speed.',
    description: 'High Speed Automatic Die Cutting & Creasing Machine fitted with creasing dies and side wheel adjustment. Available in two model variants with cutting speeds up to 10000 sheets/hour.',
    specs: [
      { key: 'Model', value: 'MY-1050FAST | MY-880FAST' },
      { key: 'Max. Die Cutting Speed', value: '10000 s/h' },
      { key: 'Die Cutting Accuracy', value: '±0.1mm' },
      { key: 'Max. Pressure', value: '350 Tons | 250 Tons' },
    ],
    media: [{ url: '/images/product/High-Speed-Automatic-Die-Cutting-and-creasing-machine.png', alt: 'High Speed Automatic Die Cutting Machine' }],
    published: true,
    reviewStatus: 'approved',
    isFeatured: true,
  },
  {
    name: 'Semi Automatic Die Cutting And Creasing Machine',
    slug: 'semi-automatic-die-cutting',
    catSlug: 'die-cutting',
    summary: 'Professional die cutting machine with programmable controller and HMI interface.',
    shortDescription: 'Professional die cutting machine with programmable controller and HMI interface.',
    description: 'Semi Automatic Die Cutting and Creasing Machine for die cutting of high end colorful boxes. Equipped with high precision intermittent mechanism, pneumatic clutch, and HMI display.',
    specs: [
      { key: 'Model', value: 'BMY1300 | BMY1500 | BMY1680' },
      { key: 'Max. Pressure', value: '350 Tons' },
      { key: 'Max. Cutting Speed', value: '5000 sheets/h' },
    ],
    media: [{ url: '/images/product/Semi-Automatic-Die-Cutting-&-Creasing-Machine.png', alt: 'Semi Automatic Die Cutting Machine' }],
    published: true,
    reviewStatus: 'approved',
    isFeatured: false,
  },
  {
    name: 'Automatic Flute Laminator Machine',
    slug: 'automatic-flute-laminator',
    catSlug: 'laminating',
    summary: 'Automatic flute laminator for cardboard and corrugated paperboard lamination. 9000 pcs/h.',
    shortDescription: 'Automatic flute laminator for cardboard and corrugated paperboard lamination.',
    description: 'Automatic Flute Laminator Machine for lamination of cardboard to cardboard or cardboard to corrugated paperboard. Designed with auto suction feeding system.',
    specs: [
      { key: 'Model', value: 'FMZ-1450H | FMZ-1600H' },
      { key: 'Max. Machine speed', value: '9000 pcs/h, 150 m/min' },
      { key: 'Precision', value: '±1mm' },
    ],
    media: [{ url: '/images/product/high-speed-automatic-flute-laminator.png', alt: 'Automatic Flute Laminator Machine' }],
    published: true,
    reviewStatus: 'approved',
    isFeatured: true,
  },
  {
    name: 'High Speed Automatic Flute Laminator',
    slug: 'high-speed-flute-laminator',
    catSlug: 'laminating',
    summary: 'High-speed flute laminator with auto suction feeding for high-end packaging.',
    shortDescription: 'High-speed flute laminator with auto suction feeding for high-end packaging.',
    description: 'High Speed Automatic Flute Laminator with auto suction feeding system for both top linerboards and bottom corrugated boards.',
    specs: [
      { key: 'Model', value: 'FMZ-1450H | FMZ-1700H' },
      { key: 'Max. Machine speed', value: '12000 pcs/h, 180 m/min' },
    ],
    media: [{ url: '/images/product/high-speed-automatic-flute-laminator.png', alt: 'High Speed Automatic Flute Laminator' }],
    published: true,
    reviewStatus: 'approved',
    isFeatured: true,
  },
  {
    name: 'Semi Automatic Flute Laminator Machine',
    slug: 'semi-automatic-flute-laminator',
    catSlug: 'laminating',
    summary: 'Semi-automatic flute laminator with automatic bottom sheet feeding.',
    shortDescription: 'Semi-automatic flute laminator with automatic bottom sheet feeding.',
    description: 'Semi Automatic Flute Laminator Machine for lamination of top paperboard to bottom paperboard. Features automatic feeding for bottom sheet and manual top sheet.',
    specs: [
      { key: 'Model', value: 'YB-1300A-II | YB-1450A-II | YB-1550A-II | YB-1650A-I' },
      { key: 'Laminating precision', value: '±1mm' },
    ],
    media: [{ url: '/images/product/semi-automatic-flute-laminator.png', alt: 'Semi Automatic Flute Laminator' }],
    published: true,
    reviewStatus: 'approved',
    isFeatured: false,
  },
  {
    name: 'Automatic Window Patching Machine',
    slug: 'automatic-window-patching',
    catSlug: 'window-patching',
    summary: 'Automatic window patching machine for high-end packaging boxes.',
    shortDescription: 'Automatic window patching machine for high-end packaging boxes.',
    description: 'Automatic Window Patching Machine for lamination of cardboard to cardboard, cardboard to corrugation paperboard. Designed with auto suction feeding system.',
    specs: [
      { key: 'Max. Cutting Speed', value: '5000 sheets/h' },
      { key: 'Max. Pressure', value: '350 Tons' },
    ],
    media: [{ url: '/images/product/Automatic-Window-Patching-Machine.png', alt: 'Automatic Window Patching Machine' }],
    published: true,
    reviewStatus: 'approved',
    isFeatured: true,
  },
  {
    name: 'RS-4 Rotary Printer',
    slug: 'rotary-printer-rs4',
    catSlug: 'printing',
    summary: 'RS-4 rotary printer with auto suction feeding for high-end packaging. 80 piece/min.',
    shortDescription: 'RS-4 rotary printer with auto suction feeding for high-end packaging.',
    description: 'RS-4 Rotary Printer with auto suction feeding system and electric adjustment system for flute. Ideal for high-end packaging boxes.',
    specs: [
      { key: 'Model', value: 'CH-1450*2600' },
      { key: 'Design Speed', value: '80 Piece/min' },
      { key: 'Max. printing size', value: '1400x2400mm' },
      { key: 'Printing precision', value: '±0.5mm' },
    ],
    media: [{ url: '/images/product/rottery-printer-RS-4.jpeg', alt: 'RS-4 Rotary Printer' }],
    published: true,
    reviewStatus: 'approved',
    isFeatured: true,
  },
  {
    name: 'NC Cutter Machine',
    slug: 'nc-cutter-machine',
    catSlug: 'cutting',
    summary: 'Numerical-control precision cutting machine for accurate, intricate cuts.',
    shortDescription: 'Numerical-control precision cutting machine for accurate, intricate cuts.',
    description: 'NC Cutter Machine combines numerical control with cutting-edge technology. Intuitive interface ensures accurate and intricate cuts on a variety of materials.',
    specs: [
      { key: 'Model', value: 'KZ-YH1' },
      { key: 'Crease Matrix Specification', value: '0.3-3MM' },
      { key: 'Speed', value: '1-50m' },
      { key: 'Voltage', value: '220v 50HZ' },
      { key: 'Weight', value: '40KG' },
    ],
    media: [{ url: '/images/product/nc-cutter-machine.jpeg', alt: 'NC Cutter Machine' }],
    published: true,
    reviewStatus: 'approved',
    isFeatured: false,
  },
  {
    name: 'Single Facer Machine',
    slug: 'single-facer-machine',
    catSlug: 'corrugating',
    summary: 'Cornerstone machine for corrugated cardboard production with high-speed automation.',
    shortDescription: 'Cornerstone machine for corrugated cardboard production.',
    description: 'Single Facer Machine — the cornerstone of corrugated cardboard production. Transforms paper into corrugated sheets essential for packaging strength.',
    specs: [
      { key: 'Production Type', value: 'Corrugated cardboard' },
      { key: 'Operation', value: 'Automated' },
    ],
    media: [{ url: '/images/product/single-facer-machine.jpeg', alt: 'Single Facer Machine' }],
    published: true,
    reviewStatus: 'approved',
    isFeatured: false,
  },
  {
    name: 'Electric Mill Roll Stand',
    slug: 'electric-mill-roll-stand',
    catSlug: 'material-handling',
    summary: 'Electric mill roll stand for efficient paper roll handling.',
    shortDescription: 'Electric mill roll stand for efficient paper roll handling.',
    description: 'Electric Mill Roll Stand Machine for unrolling and supporting paper rolls in various applications. Electric operation ensures effortless control.',
    specs: [
      { key: 'Operation', value: 'Electric' },
      { key: 'Use Case', value: 'Paper roll unrolling and support' },
    ],
    media: [{ url: '/images/product/Electric-Mill-Roll-Stand.jpeg', alt: 'Electric Mill Roll Stand' }],
    published: true,
    reviewStatus: 'approved',
    isFeatured: false,
  },
  {
    name: 'Semi Automatic Stitching Machine',
    slug: 'semi-automatic-stitching-machine',
    catSlug: 'stitching',
    summary: 'Semi-automatic stitching machine for booklets, brochures, and magazines.',
    shortDescription: 'Semi-automatic stitching machine for booklets, brochures, and magazines.',
    description: 'Semi-Automatic Stitching Machine merges automation with user control for crafting booklets, brochures, and magazines.',
    specs: [
      { key: 'Model', value: 'TYS-1600 | TYS-2000' },
      { key: 'Max. Machine speed', value: '600 Nail/Min' },
      { key: 'Pitch of Nail', value: '30-100mm' },
    ],
    media: [{ url: '/images/products/semi-automatic-stitching-machine.png', alt: 'Semi Automatic Stitching Machine' }],
    published: true,
    reviewStatus: 'approved',
    isFeatured: false,
  },
  {
    name: 'Auto Crease Matrix Cutter Machine',
    slug: 'auto-crease-matrix-cutter',
    catSlug: 'creasing-matrix',
    summary: 'Precision creasing and cutting solution with 0.3-3mm crease matrix spec.',
    shortDescription: 'Precision creasing and cutting solution with 0.3-3mm crease matrix spec.',
    description: 'KZ-YH1 Auto Crease Matrix Cutter Machine for precision creasing and cutting operations.',
    specs: [
      { key: 'Model', value: 'KZ-YH1' },
      { key: 'Crease Matrix Specification', value: '0.3-3MM' },
      { key: 'Speed', value: '1-50m' },
    ],
    media: [{ url: '/images/products/auto-crease-matrix-cutter-machine.jpg', alt: 'Auto Crease Matrix Cutter Machine' }],
    published: true,
    reviewStatus: 'approved',
    isFeatured: false,
  },
];

const offices = [
  { name: 'Head Office', city: 'Ghaziabad', state: 'Uttar Pradesh', country: 'India', address: 'SF-03, Local Shopping Complex, Shushat Aquapolis, Ghaziabad - 201009', phone: '+91 8810597980', email: 'info@barktechnologies.in', serviceEmail: 'service@barktechnologies.in', salesEmail: 'sales1@barktechnologies.in', businessHours: 'Mon - Fri: 10:00 - 18:00', isActive: true, sortOrder: 1 },
  { name: 'Spare Branch Office', city: 'Noida', state: 'Uttar Pradesh', country: 'India', address: 'F-41, 1st Floor, Sec 9, Noida 201301, UP, India', phone: '+91 9266244587', email: 'info@barktechnologies.in', isActive: true, sortOrder: 2 },
  { name: 'Service Accommodation', city: 'Ahmedabad & Vadodara', state: 'Gujarat', country: 'India', address: 'SF-03, Aquapolis', phone: '+91 9266244587', email: 'info@barktechnologies.in', isActive: true, sortOrder: 3 },
];

const faqs = [
  { question: 'What products does Bark Technologies manufacture?', answer: 'We manufacture a wide range of packaging machinery including Die Cutting & Creasing Machines, Flute Laminators, Window Patching Machines, Rotary Printers, NC Cutters, Single Facer Machines, and more.', sortOrder: 1, isActive: true },
  { question: 'Where is Bark Technologies located?', answer: 'Head Office: SF-03, Local Shopping Complex, Shushat Aquapolis, Ghaziabad - 201009. Branch: F-41, 1st Floor, Sec 9, Noida 201301. Service: Ahmedabad & Vadodara.', sortOrder: 2, isActive: true },
  { question: 'What is the warranty period?', answer: 'All machines come with a 1-year warranty covering manufacturing defects.', sortOrder: 3, isActive: true },
  { question: 'What is the typical delivery time?', answer: 'Die cutting machines: 40-60 days, flute laminators: 35-40 days, smaller machines like NC cutters: 10-15 days.', sortOrder: 4, isActive: true },
  { question: 'Do you provide installation and after-sales support?', answer: 'Yes, we provide complete installation, regular maintenance, and machine repair services across all cities we operate in.', sortOrder: 5, isActive: true },
  { question: 'How can I request a quote?', answer: 'Contact us at +91 8810597980, email info@barktechnologies.in, or use our AI chat assistant on the website.', sortOrder: 6, isActive: true },
];

const leads = [
  { contactName: 'Rajesh Kumar', email: 'rajesh@skylineprint.com', phone: '+91 9876543210', company: 'Skyline Print Pack', city: 'Delhi', source: 'web_form', status: 'contacted', priority: 'high', message: 'Interested in automatic die cutting machine', createdAt: new Date('2025-01-15') },
  { contactName: 'Priya Patel', email: 'priya@packwell.com', phone: '+91 9876543211', company: 'Packwell Industries', city: 'Ahmedabad', source: 'ai_chat', status: 'quoted', priority: 'medium', message: 'Need quote for flute laminator', createdAt: new Date('2025-02-10') },
  { contactName: 'Amit Singh', email: 'amit@boxmakers.com', phone: '+91 9876543212', company: 'Box Makers Pvt Ltd', city: 'Mumbai', source: 'phone', status: 'new', priority: 'normal', message: 'Looking for window patching machine', createdAt: new Date('2025-03-05') },
  { contactName: 'Sanjay Mehta', email: 'sanjay@printtech.com', phone: '+91 9876543213', company: 'PrintTech Solutions', city: 'Pune', source: 'email', status: 'qualified', priority: 'high', message: 'Bulk order inquiry for die cutting machines', createdAt: new Date('2025-04-12') },
  { contactName: 'Neha Sharma', email: 'neha@cartonage.com', phone: '+91 9876543214', company: 'Cartonage Industries', city: 'Bangalore', source: 'rfq', status: 'won', priority: 'medium', message: 'Successfully completed purchase', createdAt: new Date('2025-01-20') },
];

const invoices = [
  { invoiceNumber: 'BT2025001', contactName: 'Rajesh Kumar', email: 'rajesh@skylineprint.com', company: 'Skyline Print Pack', subtotal: 450000, gstAmount: 81000, total: 531000, status: 'paid', currency: 'INR', createdAt: new Date('2025-02-15') },
  { invoiceNumber: 'BT2025002', contactName: 'Priya Patel', email: 'priya@packwell.com', company: 'Packwell Industries', subtotal: 280000, gstAmount: 50400, total: 330400, status: 'sent', currency: 'INR', createdAt: new Date('2025-03-10') },
  { invoiceNumber: 'BT2025003', contactName: 'Sanjay Mehta', email: 'sanjay@printtech.com', company: 'PrintTech Solutions', subtotal: 720000, gstAmount: 129600, total: 849600, status: 'paid', currency: 'INR', createdAt: new Date('2025-04-20') },
];

const installations = [
  { title: 'Automatic Flute Laminator Installation in Morbi, Gujarat', description: 'Successful installation of our Automatic Flute Laminator Machine at a leading packaging manufacturer in Morbi, Gujarat.', location: 'Morbi, Gujarat, India', clientName: 'Packaging Manufacturer', installedOn: new Date('2023-08-08'), coverImageUrl: '/images/news-images/gujrat.png', sortOrder: 1, isActive: true },
  { title: 'Die Cutting Machine Installation in Ahmedabad', description: 'Installation of Automatic Die Cutting And Creasing Machine at a corrugated box manufacturing facility in Ahmedabad.', location: 'Ahmedabad, Gujarat, India', clientName: 'Corrugated Box Manufacturer', installedOn: new Date('2023-06-15'), coverImageUrl: '/images/news-images/16.png', sortOrder: 2, isActive: true },
  { title: 'NC Cutter Machine Installation in Noida', description: 'Installation of NC Cutter Machine at a packaging facility in Noida.', location: 'Noida, UP, India', clientName: 'Packaging Facility', installedOn: new Date('2023-05-20'), coverImageUrl: '/images/news-images/166.png', sortOrder: 3, isActive: true },
];

const newsArticles = [
  { title: 'Sheet Cutter/NC Cutter Machine — Upcoming to India', slug: 'sheet-cutter-nc-cutter-upcoming-india', summary: 'Our latest consignment featuring a high-performance Sheet Cutter/NC Cutter Machine is en route from China to India!', content: 'Big News! Our latest consignment is being loaded into containers, featuring a high-performance Sheet Cutter/NC Cutter Machine, is en route from China to India!', imageUrl: '/images/news-images/16.png', publishedAt: new Date('2023-09-16'), isPublished: true },
  { title: 'Single Color Flexo Machine — Upcoming to India', slug: 'single-color-flexo-upcoming-india', summary: 'Our latest consignment featuring a high-performance Single Color Flexo Machine is en route from China to India!', content: 'Big News! Our latest consignment is being loaded into containers, featuring a high-performance Single Color Flexo Machine.', imageUrl: '/images/news-images/166.png', publishedAt: new Date('2023-09-16'), isPublished: true },
  { title: 'Automatic Flute Laminator Machine — Successful installation in Gujarat', slug: 'automatic-flute-laminator-installation-gujarat', summary: 'Successful installation of our new Automatic Flute Laminator Machine in Morbi, Gujarat.', content: 'Successful installation of our new Automatic Flute Laminator Machine in Morbi, Gujarat.', imageUrl: '/images/news-images/gujrat.png', publishedAt: new Date('2023-08-08'), isPublished: true },
];

const blogPosts = [
  { title: 'How to Choose the Right Die Cutting Machine', slug: 'choose-right-die-cutting-machine', excerpt: 'A comprehensive guide to selecting the perfect die cutting machine.', content: 'Die cutting machines are essential for packaging manufacturers. This guide covers the key factors.', imageUrl: '/images/product/automatic-die-cutting-and-creasing.png', published: true, publishedAt: new Date('2023-09-01') },
  { title: 'Flute Lamination: Benefits and Best Practices', slug: 'flute-lamination-benefits-best-practices', excerpt: 'Learn about the benefits of flute lamination.', content: 'Flute lamination is a critical process in corrugated packaging production.', imageUrl: '/images/product/high-speed-automatic-flute-laminator.png', published: true, publishedAt: new Date('2023-08-15') },
];

const caseStudies = [
  { title: 'High-Speed Die Cutting Solution for Large-Scale Box Manufacturer', slug: 'high-speed-die-cutting-case-study', clientName: 'Large-Scale Box Manufacturer', location: 'Pune, Maharashtra', industry: 'Corrugated Packaging', summary: 'How our High Speed Automatic Die Cutting & Creasing Machine helped a large-scale box manufacturer increase production capacity by 40%.', content: 'A large-scale corrugated box manufacturer in Pune was facing production bottlenecks.', imageUrl: '/images/product/High-Speed-Automatic-Die-Cutting-and-creasing-machine.png', published: true, publishedAt: new Date('2023-07-15') },
  { title: 'Automatic Flute Laminator Transforms Production in Gujarat', slug: 'flute-laminator-gujarat-case-study', clientName: 'Packaging Manufacturer', location: 'Morbi, Gujarat', industry: 'Corrugated Packaging', summary: 'A Morbi-based packaging manufacturer improved lamination efficiency by 60%.', content: 'A packaging manufacturer in Morbi, Gujarat was struggling with manual lamination.', imageUrl: '/images/product/high-speed-automatic-flute-laminator.png', published: true, publishedAt: new Date('2023-08-10') },
];

async function seed() {
  console.log('Connecting to MongoDB...');
  console.log(`URI: ${MONGODB_URI.substring(0, 50)}...`);
  console.log(`DB: ${MONGODB_DB}`);
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  const db = mongoose.connection.db!;
  console.log('Connected.\n');

  console.log('Clearing existing data...');
  const collections = [
    'categories', 'products', 'faqs', 'offices', 'news_articles',
    'blog_posts', 'case_studies', 'leads', 'invoices',
    'product_stocks', 'installations', 'chat_logs',
    'analytics_events', 'audit_logs',
  ];
  for (const col of collections) await db.collection(col).deleteMany({});
  console.log('Cleared.\n');

  // Seed categories
  console.log(`Seeding ${categories.length} categories...`);
  const catDocs = await db.collection('categories').insertMany(
    categories.map(c => ({ ...c, createdAt: new Date(), updatedAt: new Date() }))
  );
  const catMap: Record<string, any> = {};
  Object.keys(catDocs.insertedIds).forEach((key, i) => {
    catMap[categories[i].slug] = catDocs.insertedIds[key];
  });

  // Seed products
  console.log(`Seeding ${products.length} products...`);
  await db.collection('products').insertMany(products.map(p => ({
    name: p.name,
    slug: p.slug,
    categoryId: catMap[p.catSlug],
    summary: p.summary,
    shortDescription: p.shortDescription,
    description: p.description,
    media: p.media || [],
    specs: p.specs || [],
    published: p.published,
    publishedAt: p.published ? new Date() : undefined,
    reviewStatus: p.reviewStatus || 'draft',
    isFeatured: p.isFeatured || false,
    leadTimeDays: undefined,
    warrantyMonths: 12,
    metaTitle: `${p.name} | Bark Technologies`,
    metaDescription: p.summary,
    createdAt: new Date(),
    updatedAt: new Date(),
  })));

  // Seed offices
  console.log(`Seeding ${offices.length} offices...`);
  await db.collection('offices').insertMany(offices.map(o => ({ ...o, createdAt: new Date() })));

  // Seed FAQs
  console.log(`Seeding ${faqs.length} FAQs...`);
  await db.collection('faqs').insertMany(faqs.map(f => ({ ...f, createdAt: new Date() })));

  // Seed leads
  console.log(`Seeding ${leads.length} leads...`);
  await db.collection('leads').insertMany(leads.map(l => ({ ...l, updatedAt: l.createdAt })));

  // Seed invoices
  console.log(`Seeding ${invoices.length} invoices...`);
  await db.collection('invoices').insertMany(invoices.map(i => ({ ...i, updatedAt: i.createdAt })));

  // Seed installations
  console.log(`Seeding ${installations.length} installations...`);
  await db.collection('installations').insertMany(
    installations.map(i => ({ ...i, createdAt: new Date(), updatedAt: new Date() }))
  );

  // Seed news
  console.log(`Seeding ${newsArticles.length} news articles...`);
  await db.collection('news_articles').insertMany(
    newsArticles.map(n => ({ ...n, createdAt: new Date(), updatedAt: new Date() }))
  );

  // Seed blog posts
  console.log(`Seeding ${blogPosts.length} blog posts...`);
  await db.collection('blog_posts').insertMany(
    blogPosts.map(b => ({ ...b, createdAt: new Date(), updatedAt: new Date() }))
  );

  // Seed case studies
  console.log(`Seeding ${caseStudies.length} case studies...`);
  await db.collection('case_studies').insertMany(
    caseStudies.map(c => ({ ...c, createdAt: new Date(), updatedAt: new Date() }))
  );

  // Seed admin user
  console.log('Seeding admin user...');
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  await db.collection('users').insertOne({
    email: 'admin@barktechnologies.in',
    passwordHash: hashedPassword,
    fullName: 'Bark Admin',
    role: 'super_admin',
    isActive: true,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('\n=== Seed Complete ===');
  console.log(`  Categories: ${categories.length}`);
  console.log(`  Products: ${products.length}`);
  console.log(`  Offices: ${offices.length}`);
  console.log(`  FAQs: ${faqs.length}`);
  console.log(`  Leads: ${leads.length}`);
  console.log(`  Invoices: ${invoices.length}`);
  console.log(`  Installations: ${installations.length}`);
  console.log(`  News: ${newsArticles.length}`);
  console.log(`  Blog: ${blogPosts.length}`);
  console.log(`  Case Studies: ${caseStudies.length}`);
  console.log(`  Admin: admin@barktechnologies.in (password: Admin@123)`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
