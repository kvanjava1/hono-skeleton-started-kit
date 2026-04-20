import type { Context } from "hono";
import { HTTP_STATUS, MESSAGES } from "../../configs/constants.ts";
import type {
  CreateExampleInput,
  ListExamplesQuery,
  UpdateExampleInput,
} from "../../schemas/example/crudWithJob.schema.ts";
import {
  deleteExampleById,
  getExampleDetail,
  listExamples,
  parseExampleId,
  queueCreateExample,
  queueUpdateExample,
} from "../../services/sqlite/example/crudWithJob.service.ts";
import { successResponse } from "../../utils/response.util.ts";

export const createExample = async (
  c: Context,
  payload: CreateExampleInput,
) => {
  const queuedJob = await queueCreateExample(payload);

  return successResponse(
    c,
    "Example creation queued",
    queuedJob,
    HTTP_STATUS.ACCEPTED,
  );
};

export const getExamples = async (c: Context, query: ListExamplesQuery) => {
  const result = await listExamples(query);
  return successResponse(c, MESSAGES.EXAMPLES_FETCHED, result);
};

export const getExample = async (c: Context) => {
  const id = parseExampleId(c.req.param("id"));
  const example = await getExampleDetail(id);
  return successResponse(c, MESSAGES.EXAMPLE_FETCHED, example);
};

export const updateExample = async (
  c: Context,
  payload: UpdateExampleInput,
) => {
  const id = parseExampleId(c.req.param("id"));
  const queuedJob = await queueUpdateExample(id, payload);

  return successResponse(
    c,
    "Example update queued",
    queuedJob,
    HTTP_STATUS.ACCEPTED,
  );
};

export const deleteExample = async (c: Context) => {
  const id = parseExampleId(c.req.param("id"));
  await deleteExampleById(id);
  return successResponse(c, MESSAGES.EXAMPLE_DELETED);
};
