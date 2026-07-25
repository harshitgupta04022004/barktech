import { FastifyInstance } from 'fastify';
import { Product } from '../models/product.js';
import { NewsArticle } from '../models/newsArticle.js';
import { Installation } from '../models/installation.js';
import { logger } from '../config/logger.js';

export async function liveShowcaseRoutes(app: FastifyInstance) {
  app.get('/', async (_request, reply) => {
    try {
      // Fetch published products (newest first, limit 20)
      const products = await Product.find({
        published: true,
        reviewStatus: 'approved',
      })
        .select('name slug shortDescription media categoryId createdAt')
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      // Fetch published news articles (newest first, limit 15)
      const news = await NewsArticle.find({
        published: true,
        reviewStatus: 'approved',
      })
        .select('title slug newsType excerpt coverImageUrl publishedAt createdAt')
        .sort({ createdAt: -1 })
        .limit(15)
        .lean();

      // Fetch installations (newest first, limit 15)
      const installations = await Installation.find({})
        .select('machineModel location status photos scheduledDate completedDate createdAt')
        .populate('clientId', 'fullName company')
        .sort({ createdAt: -1 })
        .limit(15)
        .lean();

      // Transform into unified showcase format
      const showcaseItems = [
        ...products.map((p: any) => ({
          type: 'product' as const,
          id: String(p._id),
          name: p.name,
          slug: p.slug,
          category: p.categoryId?.name || 'Product',
          description: p.shortDescription || p.summary || '',
          image: p.media?.[0]?.url || '/images/placeholder-product.png',
          createdAt: p.createdAt?.toISOString() || '',
        })),
        ...news.map((n: any) => ({
          type: 'news' as const,
          id: String(n._id),
          title: n.title,
          slug: n.slug,
          newsType: n.newsType || 'company',
          excerpt: n.excerpt || '',
          image: n.coverImageUrl || '/images/placeholder-news.png',
          publishedAt: n.publishedAt?.toISOString() || n.createdAt?.toISOString() || '',
        })),
        ...installations.map((inst: any) => ({
          type: 'installation' as const,
          id: String(inst._id),
          machineModel: inst.machineModel,
          clientName: inst.clientId?.fullName || inst.clientId?.company || 'Client',
          location: inst.location,
          status: inst.status,
          image: inst.photos?.[0]?.url || '/images/placeholder-installation.png',
          date: inst.completedDate?.toISOString() || inst.scheduledDate?.toISOString() || inst.createdAt?.toISOString() || '',
        })),
      ];

      // Sort all items by newest first
      showcaseItems.sort((a, b) => {
        const dateA = 'createdAt' in a ? a.createdAt : 'publishedAt' in a ? (a as any).publishedAt : (a as any).date;
        const dateB = 'createdAt' in b ? b.createdAt : 'publishedAt' in b ? (b as any).publishedAt : (b as any).date;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      return reply.send({
        success: true,
        data: showcaseItems,
        total: showcaseItems.length,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      logger.error(err, 'Failed to fetch live showcase');
      return reply.status(500).send({
        success: false,
        data: [],
        total: 0,
        updatedAt: new Date().toISOString(),
      });
    }
  });
}
