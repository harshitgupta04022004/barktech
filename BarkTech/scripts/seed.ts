/**
 * Bark Technologies — Database Seed Script
 * Run: npx tsx scripts/seed.ts
 *
 * Seeds MongoDB with real product data extracted from
 * information/barktechnologies_information_sources/
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { seedData } from './seed-data.js';

dotenv.config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/BarkTech';
const MONGODB_DB = process.env.MONGODB_DB_NAME || 'BarkTech';

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  const db = mongoose.connection.db;

  console.log('Clearing existing data...');
  await Promise.all([
    db.collection('categories').deleteMany({}),
    db.collection('products').deleteMany({}),
    db.collection('faqs').deleteMany({}),
    db.collection('offices').deleteMany({}),
    db.collection('news_articles').deleteMany({}),
    db.collection('users').deleteMany({}),
    db.collection('product_installations').deleteMany({}),
    db.collection('blog_posts').deleteMany({}),
    db.collection('case_studies').deleteMany({}),
    db.collection('pages').deleteMany({}),
    db.collection('product_stocks').deleteMany({}),
    db.collection('stock_logs').deleteMany({}),
    db.collection('analytics_events').deleteMany({}),
    db.collection('search_logs').deleteMany({}),
    db.collection('audit_logs').deleteMany({}),
    db.collection('chat_turn_logs').deleteMany({}),
    db.collection('tool_call_logs').deleteMany({}),
    db.collection('email_subscribers').deleteMany({}),
    db.collection('email_sequences').deleteMany({}),
    db.collection('email_sequence_logs').deleteMany({}),
    db.collection('content_posts').deleteMany({}),
  ]);

  console.log('Seeding categories...');
  const categoryDocs = await db.collection('categories').insertMany(seedData.categories);
  const categoryMap: Record<string, any> = {};
  Object.keys(categoryDocs.insertedIds).forEach((key, i) => {
    categoryMap[seedData.categories[i].slug] = categoryDocs.insertedIds[key];
  });

  console.log('Seeding products...');
  const productsWithCategoryIds = seedData.products.map((p: any) => ({
    ...p,
    categoryId: categoryMap[p.categorySlug],
    categorySlug: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  await db.collection('products').insertMany(productsWithCategoryIds);

  console.log('Seeding FAQs...');
  await db.collection('faqs').insertMany(
    seedData.faqs.map((f: any) => ({ ...f, createdAt: new Date(), updatedAt: new Date() }))
  );

  console.log('Seeding offices...');
  await db.collection('offices').insertMany(
    seedData.offices.map((o: any) => ({ ...o, createdAt: new Date(), updatedAt: new Date() }))
  );

  console.log('Seeding news articles...');
  await db.collection('news_articles').insertMany(
    seedData.newsArticles.map((n: any) => ({ ...n, createdAt: new Date(), updatedAt: new Date() }))
  );

  console.log('Seeding installations...');
  await db.collection('product_installations').insertMany(
    seedData.installations.map((i: any) => ({ ...i, createdAt: new Date(), updatedAt: new Date() }))
  );

  console.log('Seeding blog posts...');
  await db.collection('blog_posts').insertMany(
    seedData.blogPosts.map((b: any) => ({ ...b, createdAt: new Date(), updatedAt: new Date() }))
  );

  console.log('Seeding case studies...');
  await db.collection('case_studies').insertMany(
    seedData.caseStudies.map((c: any) => ({ ...c, createdAt: new Date(), updatedAt: new Date() }))
  );

  console.log('Seeding admin user...');
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  await db.collection('users').insertOne({
    email: 'admin@barktechnologies.in',
    password: hashedPassword,
    name: 'Bark Admin',
    role: 'super_admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('\nSeed complete!');
  console.log(`  Categories: ${seedData.categories.length}`);
  console.log(`  Products: ${seedData.products.length}`);
  console.log(`  FAQs: ${seedData.faqs.length}`);
  console.log(`  Offices: ${seedData.offices.length}`);
  console.log(`  News articles: ${seedData.newsArticles.length}`);
  console.log(`  Installations: ${seedData.installations.length}`);
  console.log(`  Blog posts: ${seedData.blogPosts.length}`);
  console.log(`  Case studies: ${seedData.caseStudies.length}`);
  console.log(`  Admin: admin@barktechnologies.in (password: Admin@123)`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
