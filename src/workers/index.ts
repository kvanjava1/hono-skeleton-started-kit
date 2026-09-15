import { createWorker } from "../queues/base.queue.ts";
import {
  processCrudCreate,
  CRUD_CREATE_QUEUE,
  type CrudCreateJobData,
} from "../jobs/example/crudCreate.job.ts";
import { logger } from "../utils/logger.util.ts";
import { requestContext } from "../utils/context.util.ts";

const startWorkers = () => {
  logger.info("Background Workers starting...");

  createWorker(CRUD_CREATE_QUEUE, async (job) => {
    const data = job.data as CrudCreateJobData;
    await requestContext.run(
      { requestId: data.requestId ?? "unknown" },
      async () => {
        await processCrudCreate(job);
      },
    );
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
