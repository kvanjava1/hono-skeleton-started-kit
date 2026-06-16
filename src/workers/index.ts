import { createWorker } from "../queues/base.queue.ts";
import { processCrudCreate, CRUD_CREATE_QUEUE } from "../jobs/example/crudCreate.job.ts";
import { logger } from "../utils/logger.util.ts";

const startWorkers = () => {
  logger.info("Background Workers starting...");

  createWorker(CRUD_CREATE_QUEUE, async (job) => {
    await processCrudCreate(job);
  });
};

const shutdown = async () => {
  logger.info("Shutting down workers...");
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

if (import.meta.main) {
  startWorkers();
}

export { startWorkers };
