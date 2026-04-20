import type { Job } from "bullmq";
import { createQueue } from "../../queues/base.queue.ts";
import { createExampleFromJob } from "../../services/sqlite/example/crudWithJob.service.ts";
import { logger } from "../../utils/logger.util.ts";

export interface CreateExampleJobPayload {
  full_name: string;
  email: string;
  passwordHash: string;
}

let createExampleQueue: ReturnType<typeof createQueue> | null = null;

const getCreateExampleQueue = () => {
  if (!createExampleQueue) {
    createExampleQueue = createQueue("create-example", "redis1");
  }

  return createExampleQueue;
};

export const createExampleProcessor = async (
  job: Job<CreateExampleJobPayload>,
): Promise<{ exampleId: number }> => {
  logger.info(`[CreateExampleJob] Processing job ${job.id}`);

  const example = await createExampleFromJob(job.data);

  logger.info(
    `[CreateExampleJob] Example ${example.id} created from job ${job.id}`,
  );

  return { exampleId: example.id };
};

export const dispatchCreateExample = async (
  payload: CreateExampleJobPayload,
) => {
  return await getCreateExampleQueue().add("create-example-task", payload);
};
