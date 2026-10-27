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
import type {
  CreateBodyInput,
  IdParamInput,
  UpdateBodyInput,
} from "../../../validations/example/crud.ts";

type JsonContext<T> = Context<any, string, { out: { json: T } }>;
type ParamContext<T> = Context<any, string, { out: { param: T } }>;
type ParamJsonContext<P, J> = Context<any, string, { out: { param: P; json: J } }>;

export const getAll = async (c: Context) => {
  const data = await listCruds();
  return successResponse(c, MESSAGES.CRUDS_FETCHED, data);
};

export const getById = async (c: ParamContext<IdParamInput>) => {
  const { id } = c.req.valid("param");
  const data = await findCrud(id);
  return successResponse(c, MESSAGES.CRUD_FETCHED, data);
};

export const create = async (c: JsonContext<CreateBodyInput>) => {
  const { title, content } = c.req.valid("json");
  const data = await addCrud({ title, content: content ?? "" });
  return successResponse(c, MESSAGES.CRUD_CREATED, data, 201);
};

export const update = async (c: ParamJsonContext<IdParamInput, UpdateBodyInput>) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const data = await editCrud(id, body);
  return successResponse(c, MESSAGES.CRUD_UPDATED, data);
};

export const createViaJob = async (c: JsonContext<CreateBodyInput>) => {
  const { title, content } = c.req.valid("json");
  const jobId = await enqueueCrudCreate({ title, content: content ?? "" });
  return successResponse(c, MESSAGES.CRUD_QUEUED, { jobId }, HTTP_STATUS.ACCEPTED);
};

export const remove = async (c: ParamContext<IdParamInput>) => {
  const { id } = c.req.valid("param");
  await removeCrud(id);
  return successResponse(c, MESSAGES.CRUD_DELETED, null);
};
