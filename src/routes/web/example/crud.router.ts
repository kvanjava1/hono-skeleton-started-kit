import { Hono } from "hono";
import { sameOriginGuard } from "../../../middlewares/web/sameOrigin.middleware.ts";
import {
  showCrudsIndex,
  showCrudEdit,
  createCrudFromWeb,
  updateCrudFromWeb,
  deleteCrudFromWeb,
} from "../../../controllers/web/example/crud.controller.ts";

/**
 * Web routes for the Inertia + Svelte CRUD demo (mounted at "/").
 * Mutations reuse the same CrudService as the REST API and are guarded by
 * the same-origin middleware (session-bound CSRF tokens arrive in Phase 2).
 */
export const exampleCrudWebRoutes = new Hono();

exampleCrudWebRoutes.get("/", showCrudsIndex);
exampleCrudWebRoutes.get("/cruds/:id/edit", showCrudEdit);
exampleCrudWebRoutes.post("/cruds", sameOriginGuard, createCrudFromWeb);
exampleCrudWebRoutes.put("/cruds/:id", sameOriginGuard, updateCrudFromWeb);
exampleCrudWebRoutes.delete("/cruds/:id", sameOriginGuard, deleteCrudFromWeb);
