import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../lib/logger';

export async function connectDb(): Promise<void> {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info({ msg: 'MongoDB connected', host: mongoose.connection.host });
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection failed');
    throw error;
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error');
  });
}
