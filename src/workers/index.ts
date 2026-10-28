import type { Worker } from "bullmq";
import { createWorker } from "../queues/base.queue.ts";
import {
  processCrudCreate,
  CRUD_CREATE_QUEUE,
  type CrudCreateJobData,
} from "../jobs/example/crudCreate.job.ts";
import {
  processSendEmail,
  SEND_EMAIL_QUEUE,
  type SendEmailJobData,
} from "../jobs/mail/sendEmail.job.ts";
import { logger } from "../utils/logger.util.ts";
import { requestContext } from "../utils/context.util.ts";

const activeWorkers: Worker[] = [];

const startWorkers = () => {
  logger.info("Background Workers starting...");

  const crudWorker = createWorker(CRUD_CREATE_QUEUE, async (job) => {
    const data = job.data as CrudCreateJobData;
    await requestContext.run(
      { requestId: data.requestId ?? "unknown" },
      async () => {
        await processCrudCreate(job);
      },
    );
  });
  activeWorkers.push(crudWorker);

  const mailWorker = createWorker(SEND_EMAIL_QUEUE, async (job) => {
    const data = job.data as SendEmailJobData;
    await requestContext.run(
      { requestId: data.requestId ?? "unknown" },
      async () => {
        await processSendEmail(job);
      },
    );
  });
  activeWorkers.push(mailWorker);
};

const stopWorkers = async (): Promise<void> => {
  logger.info("Stopping background workers...");
  await Promise.all(activeWorkers.map((w) => w.close()));
  activeWorkers.length = 0;
  logger.info("All background workers stopped");
};

if (import.meta.main) {
  startWorkers();

  const shutdown = async () => {
    await stopWorkers();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

export { startWorkers, stopWorkers };
