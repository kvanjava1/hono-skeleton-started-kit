import { createQueue } from "../../queues/base.queue.ts";
import { createCrud } from "../../repositories/example/crud.repository.ts";
import { logger } from "../../utils/logger.util.ts";

export const CRUD_CREATE_QUEUE = "crud-create";

export type CrudCreateJobData = {
  title: string;
  content: string;
};

export const enqueueCrudCreate = async (data: CrudCreateJobData) => {
  const queue = createQueue(CRUD_CREATE_QUEUE);
  const job = await queue.add("create", data);
  return job.id;
};

export const processCrudCreate = async (job: { data: CrudCreateJobData }) => {
  const { title, content } = job.data;
  const crud = await createCrud({ title, content });
  logger.info(`Crud [${crud.id}] created via job`);
  return crud;
};
