import mongoose from 'mongoose';
import { env } from './env.js';
import pino from 'pino';

const logger = pino({ name: 'database' });

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
    });
    logger.info({ db: env.MONGODB_DB_NAME }, 'MongoDB connected');
  } catch (error) {
    logger.error({ error }, 'MongoDB connection failed');
    process.exit(1);
  }

  mongoose.connection.on('error', (error) => {
    logger.error({ error }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
