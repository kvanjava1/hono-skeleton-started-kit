import { NotFoundError } from "../../utils/errors.util.ts";
import { MESSAGES } from "../../configs/constants.ts";
import { cacheGet, cacheSet, cacheDelete } from "../../utils/cache.util.ts";
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
  if (cached) return cached;

  const data = await getAllCruds();
  await cacheSet(listKey, data, CACHE_TTL);
  return data;
};

export const findCrud = async (id: number): Promise<Crud> => {
  const cached = await cacheGet<Crud>(byIdKey(id));
  if (cached) return cached;

  const crud = await getCrudById(id);
  if (!crud) throw new NotFoundError(MESSAGES.CRUD_NOT_FOUND);

  await cacheSet(byIdKey(id), crud, CACHE_TTL);
  return crud;
};

export const addCrud = async (input: CreateCrudInput): Promise<Crud> => {
  const [data] = await Promise.all([createCrud(input), cacheDelete(listKey)]);
  return data;
};

export const editCrud = async (id: number, input: UpdateCrudInput): Promise<Crud> => {
  const updated = await updateCrud(id, input);
  if (!updated) throw new NotFoundError(MESSAGES.CRUD_NOT_FOUND);

  await Promise.all([cacheDelete(listKey), cacheDelete(byIdKey(id))]);
  return updated;
};

export const removeCrud = async (id: number): Promise<void> => {
  const deleted = await deleteCrud(id);
  if (!deleted) throw new NotFoundError(MESSAGES.CRUD_NOT_FOUND);

  await Promise.all([cacheDelete(listKey), cacheDelete(byIdKey(id))]);
};
