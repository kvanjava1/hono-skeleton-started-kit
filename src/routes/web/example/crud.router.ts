import { Hono } from "hono";
import { ROUTES } from "../../../configs/routes.config.ts";
import { sameOriginGuard } from "../../../middlewares/web/sameOrigin.middleware.ts";
import {
  showCrudsIndex,
  showCrudEdit,
  createCrudFromWeb,
  updateCrudFromWeb,
  deleteCrudFromWeb,
} from "../../../controllers/web/example/crud.controller.ts";

/**
 * Web routes for the Inertia + Svelte CRUD demo (mounted at ROUTES.WEB.ROOT).
 * Paths resolve from the ROUTES.WEB registry — never string literals.
 * Mutations reuse the same CrudService as the REST API and are guarded by
 * the same-origin middleware (session-bound CSRF tokens arrive in Phase 2).
 */
export const exampleCrudWebRoutes = new Hono();

exampleCrudWebRoutes.get(ROUTES.WEB.EXAMPLE_CRUD.INDEX, showCrudsIndex);
exampleCrudWebRoutes.get(ROUTES.WEB.EXAMPLE_CRUD.EDIT, showCrudEdit);
exampleCrudWebRoutes.post(ROUTES.WEB.EXAMPLE_CRUD.CREATE, sameOriginGuard, createCrudFromWeb);
exampleCrudWebRoutes.put(ROUTES.WEB.EXAMPLE_CRUD.UPDATE, sameOriginGuard, updateCrudFromWeb);
exampleCrudWebRoutes.delete(ROUTES.WEB.EXAMPLE_CRUD.DELETE, sameOriginGuard, deleteCrudFromWeb);
