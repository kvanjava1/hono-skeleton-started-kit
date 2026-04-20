import { createExampleProcessor } from "../jobs/example/crudWithJobCreate.job.ts";
import { updateExampleProcessor } from "../jobs/example/crudWithJobUpdate.job.ts";
import { createWorker } from "../queues/base.queue.ts";
import { logger } from "../utils/logger.util.ts";

/**
 * Initialize all Workers
 */
const startWorkers = () => {
  logger.info("Background Workers starting...");
  
  createWorker("create-example", createExampleProcessor, "redis1");
  logger.info('Worker "create-example" registered on redis1.');

  createWorker("update-example", updateExampleProcessor, "redis1");
  logger.info('Worker "update-example" registered on redis1.');
};

const shutdown = async () => {
  logger.info("Shutting down workers...");
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// "import.meta.main" is true ONLY when this file is run directly (bun run src/workers/index.ts)
// It is false when this file is imported by src/index.ts
if (import.meta.main) {
  startWorkers();
}

export { startWorkers };
