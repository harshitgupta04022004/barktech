import pino from 'pino';
import mongoose from 'mongoose';

const logger = pino({ name: 'scheduler' });

export const schedulerService = {
  startPoller() {
    logger.info('Scheduler poller disabled (social publishing removed)');
  },

  startWorker() {
    logger.info('Scheduler worker disabled (social publishing removed)');
  },

  async enqueuePublish(contentId: string, platforms: string[]): Promise<void> {
    logger.info(`Enqueueing publish for content ${contentId} to platforms: ${platforms.join(', ')}`);
    // Store the publish request in MongoDB for later processing
    const db = mongoose.connection.db;
    if (db) {
      await db.collection('social_publish_queue').insertOne({
        content_id: contentId,
        platforms,
        status: 'pending',
        created_at: new Date(),
      });
    }
  },

  async shutdown() {
    logger.info('Scheduler shutdown');
  },
};
