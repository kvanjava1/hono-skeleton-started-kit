import { MESSAGES } from "../../../configs/constants.ts";
import {
  cacheDeleteByPattern,
  cacheGet,
  cacheSet,
} from "../../../utils/cache.util.ts";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../../utils/errors.util.ts";
import { logger } from "../../../utils/logger.util.ts";
import {
  dispatchCreateExample,
  type CreateExampleJobPayload,
} from "../../../jobs/example/crudWithJobCreate.job.ts";
import {
  dispatchUpdateExample,
  type UpdateExampleJobPayload,
} from "../../../jobs/example/crudWithJobUpdate.job.ts";
import type {
  CreateExampleInput,
  ListExamplesQuery,
  UpdateExampleInput,
} from "../../../schemas/example/crudWithJob.schema.ts";
import {
  countExamples,
  createExample,
  findExampleByEmail,
  findExampleById,
  findExamples,
  softDeleteExample,
  updateExample,
  type ExampleRecord,
} from "../../../repositories/sqlite/example/crudWithJob.repository.ts";

export interface ExampleResponse {
  id: number;
  full_name: string;
  email: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

const DUPLICATE_EMAIL_MESSAGE = "The data you provided already exists.";
const EXAMPLES_LIST_CACHE_PREFIX = "examples:list:";
const EXAMPLES_LIST_CACHE_TTL_SECONDS = 120;

const sanitizeExample = (example: ExampleRecord): ExampleResponse => {
  return {
    id: example.id,
    full_name: example.full_name,
    email: example.email,
    created_at: example.created_at,
    updated_at: example.updated_at,
    deleted_at: example.deleted_at,
  };
};

export const parseExampleId = (value: string): number => {
  const exampleId = Number.parseInt(value, 10);

  if (!Number.isInteger(exampleId) || exampleId <= 0) {
    throw new ValidationError("Example id must be a positive integer");
  }

  return exampleId;
};

const assertEmailAvailable = (email: string, currentExampleId?: number): void => {
  const existingExample = findExampleByEmail(email);

  if (existingExample && existingExample.id !== currentExampleId) {
    throw new ConflictError(DUPLICATE_EMAIL_MESSAGE);
  }
};

const hashPassword = async (password: string): Promise<string> => {
  return await Bun.password.hash(password);
};

const buildExamplesListCacheKey = (query: ListExamplesQuery): string => {
  const normalizedEntries = Object.entries({
    email: query.email ?? "",
    full_name: query.full_name ?? "",
    id: query.id ?? "",
    limit: query.limit,
    page: query.page,
  }).sort(([left], [right]) => left.localeCompare(right));

  const searchParams = new URLSearchParams();

  for (const [key, value] of normalizedEntries) {
    if (value === "") continue;
    searchParams.set(key, String(value));
  }

  return `${EXAMPLES_LIST_CACHE_PREFIX}${searchParams.toString() || "default"}`;
};

const invalidateExamplesListCache = async (): Promise<void> => {
  await cacheDeleteByPattern(`${EXAMPLES_LIST_CACHE_PREFIX}*`);
};

export const queueCreateExample = async (input: CreateExampleInput) => {
  assertEmailAvailable(input.email);

  const payload: CreateExampleJobPayload = {
    full_name: input.full_name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
  };

  const job = await dispatchCreateExample(payload);

  logger.info(`[ExampleService] Example creation queued`, {
    email: input.email,
    jobId: job.id,
  });

  return {
    job_id: job.id,
    status: "queued" as const,
  };
};

export const createExampleFromJob = async (
  payload: CreateExampleJobPayload,
) => {
  assertEmailAvailable(payload.email);

  const createdExample = createExample({
    full_name: payload.full_name,
    email: payload.email,
    password: payload.passwordHash,
  });

  await invalidateExamplesListCache();

  return createdExample;
};

export const queueUpdateExample = async (
  id: number,
  input: UpdateExampleInput,
) => {
  const existingExample = findExampleById(id);

  if (!existingExample) {
    throw new NotFoundError(MESSAGES.EXAMPLE_NOT_FOUND);
  }

  assertEmailAvailable(input.email, id);

  const payload: UpdateExampleJobPayload = {
    id,
    full_name: input.full_name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
  };

  const job = await dispatchUpdateExample(payload);

  logger.info(`[ExampleService] Example update queued`, {
    id,
    email: input.email,
    jobId: job.id,
  });

  return {
    job_id: job.id,
    status: "queued" as const,
  };
};

export const updateExampleFromJob = async (
  payload: UpdateExampleJobPayload,
) => {
  const updatedExample = updateExample(payload.id, {
    full_name: payload.full_name,
    email: payload.email,
    password: payload.passwordHash,
  });

  if (!updatedExample) {
    throw new NotFoundError(MESSAGES.EXAMPLE_NOT_FOUND);
  }

  await invalidateExamplesListCache();

  return updatedExample;
};

export const listExamples = async (query: ListExamplesQuery) => {
  const cacheKey = buildExamplesListCacheKey(query);
  const cachedResponse = await cacheGet<{
    items: ExampleResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(cacheKey);

  if (cachedResponse) {
    return cachedResponse;
  }

  const items = findExamples(query.page, query.limit, {
    id: query.id,
    full_name: query.full_name,
    email: query.email,
  }).map(sanitizeExample);

  const total = countExamples({
    id: query.id,
    full_name: query.full_name,
    email: query.email,
  });

  const response = {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };

  await cacheSet(cacheKey, response, EXAMPLES_LIST_CACHE_TTL_SECONDS);

  return response;
};

export const getExampleDetail = async (id: number): Promise<ExampleResponse> => {
  const example = findExampleById(id);

  if (!example) {
    throw new NotFoundError(MESSAGES.EXAMPLE_NOT_FOUND);
  }

  return sanitizeExample(example);
};

export const updateExampleById = async (
  id: number,
  input: UpdateExampleInput,
): Promise<ExampleResponse> => {
  const existingExample = findExampleById(id);

  if (!existingExample) {
    throw new NotFoundError(MESSAGES.EXAMPLE_NOT_FOUND);
  }

  assertEmailAvailable(input.email, id);

  const updatedExample = updateExample(id, {
    full_name: input.full_name,
    email: input.email,
    password: await hashPassword(input.password),
  });

  if (!updatedExample) {
    throw new NotFoundError(MESSAGES.EXAMPLE_NOT_FOUND);
  }

  await invalidateExamplesListCache();

  return sanitizeExample(updatedExample);
};

export const deleteExampleById = async (id: number): Promise<void> => {
  const deleted = softDeleteExample(id);

  if (!deleted) {
    throw new NotFoundError(MESSAGES.EXAMPLE_NOT_FOUND);
  }

  await invalidateExamplesListCache();
};
