import type { Context } from "hono";
import * as CrudService from "../../../services/example/crud.service.ts";
import {
  CreateBody,
  UpdateBody,
  IdParam,
} from "../../../validations/example/crud.ts";
import { ValidationError } from "../../../utils/errors.util.ts";
import { toInertiaErrorBag } from "../../../utils/inertia.util.ts";
import { logger } from "../../../utils/logger.util.ts";
import { ROUTES } from "../../../configs/routes.config.ts";

/**
 * Web controller for the Example CRUD demo driven by Inertia.js + Svelte.
 * Reuses the same service and Zod validation schemas as the REST API
 * (`/api/example/cruds`) — no duplicated business logic.
 */

const parseJsonBody = async (c: Context): Promise<unknown> => {
  return await c.req.json().catch(() => ({}));
};

/** GET / — CRUD list page (Inertia). */
export const showCrudsIndex = async (c: Context) => {
  const cruds = await CrudService.listCruds();
  return c.render("example1/Cruds/Index", { cruds });
};

/** GET /cruds/:id/edit — edit page (Inertia). */
export const showCrudEdit = async (c: Context) => {
  const crud = await CrudService.findCrud(Number(c.req.param("id")));
  return c.render("example1/Cruds/Edit", { crud });
};

/** POST /cruds — create from the Inertia form (validation -> 422 error bag). */
export const createCrudFromWeb = async (c: Context) => {
  const parsed = CreateBody.safeParse(await parseJsonBody(c));
  if (!parsed.success) {
    throw new ValidationError("Validation failed", toInertiaErrorBag(parsed.error));
  }

  const crud = await CrudService.addCrud({
    title: parsed.data.title,
    content: parsed.data.content ?? "",
  });
  logger.info("[CrudWeb] Crud created via Inertia form", { id: crud.id });
  return c.redirect(ROUTES.WEB.ROOT);
};

/** PUT /cruds/:id — update from the Inertia form. */
export const updateCrudFromWeb = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    throw new ValidationError("Validation failed", toInertiaErrorBag(idParsed.error));
  }

  const parsed = UpdateBody.safeParse(await parseJsonBody(c));
  if (!parsed.success) {
    throw new ValidationError("Validation failed", toInertiaErrorBag(parsed.error));
  }

  await CrudService.editCrud(idParsed.data.id, parsed.data);
  logger.info("[CrudWeb] Crud updated via Inertia form", { id: idParsed.data.id });
  return c.redirect(ROUTES.WEB.ROOT);
};

/** DELETE /cruds/:id — delete from the Inertia list (soft delete). */
export const deleteCrudFromWeb = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    throw new ValidationError("Validation failed", toInertiaErrorBag(idParsed.error));
  }

  await CrudService.removeCrud(idParsed.data.id);
  logger.info("[CrudWeb] Crud deleted via Inertia", { id: idParsed.data.id });
  return c.redirect(ROUTES.WEB.ROOT);
};
