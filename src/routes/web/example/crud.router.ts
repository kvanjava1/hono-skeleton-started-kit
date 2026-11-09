import { Hono } from "hono";
import { ROUTES } from "../../../configs/routes.config.ts";
import { csrfGuard } from "../../../middlewares/web/sameOrigin.middleware.ts";
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
 * the two-layer CSRF middleware (origin check + session-bound token).
 */
export const exampleCrudWebRoutes = new Hono();

exampleCrudWebRoutes.get(ROUTES.WEB.EXAMPLE_CRUD.INDEX, showCrudsIndex);
exampleCrudWebRoutes.get(ROUTES.WEB.EXAMPLE_CRUD.EDIT, showCrudEdit);
exampleCrudWebRoutes.post(ROUTES.WEB.EXAMPLE_CRUD.CREATE, csrfGuard, createCrudFromWeb);
exampleCrudWebRoutes.put(ROUTES.WEB.EXAMPLE_CRUD.UPDATE, csrfGuard, updateCrudFromWeb);
exampleCrudWebRoutes.delete(ROUTES.WEB.EXAMPLE_CRUD.DELETE, csrfGuard, deleteCrudFromWeb);
