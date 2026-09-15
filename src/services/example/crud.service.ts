import { NotFoundError } from "../../utils/errors.util.ts";
import { MESSAGES } from "../../configs/constants.ts";
import { cacheGet, cacheSet, cacheDelete } from "../../utils/cache.util.ts";
import { logger } from "../../utils/logger.util.ts";
import {
  getAllCruds,
  getCrudById,
  createCrud,
  updateCrud,
  deleteCrud,
  type CreateCrudInput,
  type UpdateCrudInput,
  type Crud,
} from "../../repositories/example/crud.repository.ts";

const CACHE_TTL = 300;

const listKey = "cruds:list";
const byIdKey = (id: number) => `cruds:${id}`;

export const listCruds = async (): Promise<Crud[]> => {
  const cached = await cacheGet<Crud[]>(listKey);
  if (cached) {
    logger.debug("[CrudService] Crud list served from cache");
    return cached;
  }

  const data = await getAllCruds();
  await cacheSet(listKey, data, CACHE_TTL);
  logger.debug("[CrudService] Crud list loaded from database", {
    count: data.length,
  });
  return data;
};

export const findCrud = async (id: number): Promise<Crud> => {
  const cached = await cacheGet<Crud>(byIdKey(id));
  if (cached) {
    logger.debug("[CrudService] Crud served from cache", { id });
    return cached;
  }

  const crud = await getCrudById(id);
  if (!crud) {
    logger.warn("[CrudService] Crud not found", { id });
    throw new NotFoundError(MESSAGES.CRUD_NOT_FOUND);
  }

  await cacheSet(byIdKey(id), crud, CACHE_TTL);
  logger.debug("[CrudService] Crud loaded from database", { id });
  return crud;
};

export const addCrud = async (input: CreateCrudInput): Promise<Crud> => {
  const [data] = await Promise.all([createCrud(input), cacheDelete(listKey)]);
  logger.info("[CrudService] Crud created", { id: data.id, title: data.title });
  return data;
};

export const editCrud = async (id: number, input: UpdateCrudInput): Promise<Crud> => {
  const updated = await updateCrud(id, input);
  if (!updated) {
    logger.warn("[CrudService] Crud not found", { id });
    throw new NotFoundError(MESSAGES.CRUD_NOT_FOUND);
  }

  await Promise.all([cacheDelete(listKey), cacheDelete(byIdKey(id))]);
  logger.info("[CrudService] Crud updated", { id });
  return updated;
};

export const removeCrud = async (id: number): Promise<void> => {
  const deleted = await deleteCrud(id);
  if (!deleted) {
    logger.warn("[CrudService] Crud not found", { id });
    throw new NotFoundError(MESSAGES.CRUD_NOT_FOUND);
  }

  await Promise.all([cacheDelete(listKey), cacheDelete(byIdKey(id))]);
  logger.info("[CrudService] Crud deleted", { id });
};
