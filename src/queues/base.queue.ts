import { Queue, Worker, type Job, type Processor } from "bullmq";
import {
  configApp,
  configQueue,
  configRedis,
  type RedisConnectionName,
} from "../configs/index.ts";
import { logger } from "../utils/logger.util.ts";
import {
  queueJobDurationMs,
  queueJobsTotal,
} from "../utils/metrics.util.ts";

const getQueueConnectionOptions = (
  connectionName: RedisConnectionName = "redis1",
) => {
  const redisConfig = configRedis()[connectionName];

  return {
    host: redisConfig.host,
    port: redisConfig.port,
  };
};

/**
 * Base Queue Factory
 */
export const createQueue = (
  name: string,
  connectionName: RedisConnectionName = "redis1",
) => {
  return new Queue(name, {
    connection: getQueueConnectionOptions(connectionName),
    defaultJobOptions: {
      removeOnComplete: configQueue.removeOnComplete,
      removeOnFail: configQueue.removeOnFail,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    },
  });
};

/**
 * Base Worker Factory
 */
export const createWorker = (
  name: string,
  processor: Processor,
  connectionName: RedisConnectionName = "redis1",
) => {
  const worker = new Worker(name, processor, {
    connection: getQueueConnectionOptions(connectionName),
    concurrency: configQueue.concurrency,
  });

  worker.on("completed", (job: Job) => {
    logger.info("[Queue] Job completed", { queue: name, jobId: job.id });

    if (configApp.metricsEnabled) {
      queueJobsTotal.inc({ queue: name, status: "completed" });

      if (job.processedOn !== undefined && job.finishedOn !== undefined) {
        queueJobDurationMs.observe(
          { queue: name },
          job.finishedOn - job.processedOn,
        );
      }
    }
  });

  worker.on("failed", (job: Job | undefined, err: Error) => {
    logger.error("[Queue] Job failed", {
      queue: name,
      jobId: job?.id,
      error: err.message,
    });

    if (configApp.metricsEnabled) {
      queueJobsTotal.inc({ queue: name, status: "failed" });
    }
  });

  return worker;
};
