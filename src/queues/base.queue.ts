import { Queue, Worker, type Job, type Processor } from "bullmq";
import {
  configQueue,
  configRedis,
  type RedisConnectionName,
} from "../configs/index.ts";
import { logger } from "../utils/logger.util.ts";

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
    logger.info(`Job ${job.id} [${name}] has completed!`);
  });

  worker.on("failed", (job: Job | undefined, err: Error) => {
    logger.error(`Job ${job?.id} [${name}] has failed with ${err.message}`);
  });

  return worker;
};
