import type { Job } from "bullmq";
import { createQueue } from "../../queues/base.queue.ts";
import { updateExampleFromJob } from "../../services/sqlite/example/crudWithJob.service.ts";
import { logger } from "../../utils/logger.util.ts";

export interface UpdateExampleJobPayload {
  id: number;
  full_name: string;
  email: string;
  passwordHash: string;
}

let updateExampleQueue: ReturnType<typeof createQueue> | null = null;

const getUpdateExampleQueue = () => {
  if (!updateExampleQueue) {
    updateExampleQueue = createQueue("update-example", "redis1");
  }

  return updateExampleQueue;
};

export const updateExampleProcessor = async (
  job: Job<UpdateExampleJobPayload>,
): Promise<{ exampleId: number }> => {
  logger.info(`[UpdateExampleJob] Processing job ${job.id} for example ${job.data.id}`);

  const example = await updateExampleFromJob(job.data);

  logger.info(
    `[UpdateExampleJob] Example ${example.id} updated from job ${job.id}`,
  );

  return { exampleId: example.id };
};

export const dispatchUpdateExample = async (
  payload: UpdateExampleJobPayload,
) => {
  return await getUpdateExampleQueue().add("update-example-task", payload);
};
