import { serve } from 'bun';
import { app } from './app.ts';
import { connectAllDatabases, disconnectAllDatabases } from './database/index.ts';
import { configApp } from './configs/index.ts';
import { logger } from './utils/logger.util.ts';

import { startWorkers } from './workers/index.ts';

const run = async () => {
  const isWorker = process.argv.includes('--worker');

  const shutdown = async (signal: string) => {
    logger.info(`Shutting down (${signal})...`);
    try {
      await disconnectAllDatabases();
    } catch (error) {
      logger.error('Error during disconnect', error);
    }
    process.exit(0);
  };

  try {
    if (isWorker) {
      logger.info('Starting Background Worker mode...');
      logger.info('Connecting to databases...');
      await connectAllDatabases();
      startWorkers();

      process.on('SIGINT', () => shutdown('SIGINT'));
      process.on('SIGTERM', () => shutdown('SIGTERM'));
    } else {
      logger.info('Starting API Server mode...');
      logger.info(`Environment: ${configApp.nodeEnv}`);
      logger.info('Connecting to databases...');
      await connectAllDatabases();
      logger.info('All databases connected');

      const server = serve({
        port: configApp.port,
        fetch: app.fetch,
      });

      const shutdownWithServerStop = async (signal: string) => {
        logger.info(`Shutting down server (${signal})...`);
        server.stop();
        await shutdown(signal);
      };

      process.on('SIGINT', () => shutdownWithServerStop('SIGINT'));
      process.on('SIGTERM', () => shutdownWithServerStop('SIGTERM'));
      logger.info(`Server running on http://localhost:${configApp.port}`);
      logger.info('Press Ctrl+C to stop');
    }
  } catch (error) {
    logger.error('Failed to start process', error);
    process.exit(1);
  }
};

run();
