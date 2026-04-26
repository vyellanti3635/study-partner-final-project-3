import mongoose from 'mongoose';
import { env } from './config/env';
import { connectDb } from './config/db';
import { createApp } from './app';
import { logger } from './lib/logger';

async function main(): Promise<void> {
  await connectDb();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'HTTP server listening');
  });

  function shutdown(signal: string): void {
    logger.info({ signal }, 'Shutdown signal received — closing server');
    server.close(() => {
      logger.info('HTTP server closed');
      mongoose.connection.close(false).then(() => {
        logger.info('MongoDB connection closed');
        process.exit(0);
      });
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  logger.error({ err: error }, 'Fatal startup error');
  process.exit(1);
});
