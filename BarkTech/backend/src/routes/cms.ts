import { FastifyInstance } from 'fastify';
import {
  caseStudyController,
  newsController,
  blogController,
  faqController,
  officeController,
  pageController,
} from '../controllers/cms.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export async function cmsRoutes(app: FastifyInstance) {
  // ════════════════════════════════════════════════════
  // Case Studies — /api/cms/case-studies
  // ════════════════════════════════════════════════════
  app.get('/case-studies', caseStudyController.list);
  app.get('/case-studies/slug/:slug', caseStudyController.getBySlug);
  app.get('/case-studies/:id', caseStudyController.getById);
  app.post('/case-studies', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, caseStudyController.create);
  app.put('/case-studies/:id', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, caseStudyController.update);
  app.delete('/case-studies/:id', { preHandler: [authenticate, requireRole('super_admin')] }, caseStudyController.delete);
  app.patch('/case-studies/:id/publish', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, caseStudyController.publish);
  app.patch('/case-studies/:id/unpublish', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, caseStudyController.unpublish);

  // ════════════════════════════════════════════════════
  // News — /api/cms/news
  // ════════════════════════════════════════════════════
  app.get('/news', newsController.list);
  app.get('/news/slug/:slug', newsController.getBySlug);
  app.get('/news/:id', newsController.getById);
  app.post('/news', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, newsController.create);
  app.put('/news/:id', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, newsController.update);
  app.delete('/news/:id', { preHandler: [authenticate, requireRole('super_admin')] }, newsController.delete);
  app.patch('/news/:id/publish', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, newsController.publish);
  app.patch('/news/:id/unpublish', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, newsController.unpublish);

  // ════════════════════════════════════════════════════
  // Blog — /api/cms/blog
  // ════════════════════════════════════════════════════
  app.get('/blog', blogController.list);
  app.get('/blog/slug/:slug', blogController.getBySlug);
  app.get('/blog/:id', blogController.getById);
  app.post('/blog', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, blogController.create);
  app.put('/blog/:id', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, blogController.update);
  app.delete('/blog/:id', { preHandler: [authenticate, requireRole('super_admin')] }, blogController.delete);
  app.patch('/blog/:id/publish', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, blogController.publish);
  app.patch('/blog/:id/unpublish', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, blogController.unpublish);

  // ════════════════════════════════════════════════════
  // FAQs — /api/cms/faqs
  // ════════════════════════════════════════════════════
  app.get('/faqs', faqController.list);
  app.get('/faqs/:id', faqController.getById);
  app.post('/faqs', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, faqController.create);
  app.put('/faqs/:id', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, faqController.update);
  app.delete('/faqs/:id', { preHandler: [authenticate, requireRole('super_admin')] }, faqController.delete);
  app.patch('/faqs/:id/toggle', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, faqController.toggle);

  // ════════════════════════════════════════════════════
  // Offices — /api/cms/offices
  // ════════════════════════════════════════════════════
  app.get('/offices', officeController.list);
  app.get('/offices/:id', officeController.getById);
  app.post('/offices', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, officeController.create);
  app.put('/offices/:id', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, officeController.update);
  app.delete('/offices/:id', { preHandler: [authenticate, requireRole('super_admin')] }, officeController.delete);
  app.patch('/offices/:id/toggle', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, officeController.toggle);

  // ════════════════════════════════════════════════════
  // Pages — /api/cms/pages
  // ════════════════════════════════════════════════════
  app.get('/pages', pageController.list);
  app.get('/pages/slug/:slug', pageController.getBySlug);
  app.get('/pages/:id', pageController.getById);
  app.post('/pages', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, pageController.create);
  app.put('/pages/:id', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, pageController.update);
  app.delete('/pages/:id', { preHandler: [authenticate, requireRole('super_admin')] }, pageController.delete);
  app.patch('/pages/:id/publish', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, pageController.publish);
  app.patch('/pages/:id/unpublish', { preHandler: [authenticate, requireRole('super_admin', 'admin')] }, pageController.unpublish);
}
