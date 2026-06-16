import type { Context } from "hono";
import { MESSAGES, HTTP_STATUS } from "../../../configs/constants.ts";
import { successResponse } from "../../../utils/response.util.ts";
import {
  listCruds,
  findCrud,
  addCrud,
  editCrud,
  removeCrud,
} from "../../../services/example/crud.service.ts";
import { enqueueCrudCreate } from "../../../jobs/example/crudCreate.job.ts";

export const getAll = async (c: Context) => {
  const data = await listCruds();
  return successResponse(c, MESSAGES.CRUDS_FETCHED, data);
};

export const getById = async (c: Context) => {
  const id = c.req.param("id");
  const data = await findCrud(Number(id));
  return successResponse(c, MESSAGES.CRUD_FETCHED, data);
};

export const create = async (c: Context) => {
  const { title, content } = await c.req.json<{ title: string; content?: string }>();
  const data = await addCrud({ title, content: content ?? "" });
  return successResponse(c, MESSAGES.CRUD_CREATED, data, 201);
};

export const update = async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ title?: string; content?: string }>();
  const data = await editCrud(Number(id), body);
  return successResponse(c, MESSAGES.CRUD_UPDATED, data);
};

export const createViaJob = async (c: Context) => {
  const { title, content } = await c.req.json<{ title: string; content?: string }>();
  const jobId = await enqueueCrudCreate({ title, content: content ?? "" });
  return successResponse(c, MESSAGES.CRUD_QUEUED, { jobId }, HTTP_STATUS.ACCEPTED);
};

export const remove = async (c: Context) => {
  const id = c.req.param("id");
  await removeCrud(Number(id));
  return successResponse(c, MESSAGES.CRUD_DELETED, null);
};
