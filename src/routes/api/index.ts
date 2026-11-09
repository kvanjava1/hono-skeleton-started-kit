import { OpenAPIHono } from "@hono/zod-openapi";

/**
 * API surface (OpenAPI endpoints only). Currently EMPTY — the demo CRUD
 * module was removed; the wiring stays so a real domain can be mounted
 * without touching the bootstrap.
 *
 * Every registered endpoint must resolve its path from ROUTES.API and be
 * mounted at "/" (absolute registry paths + spec-path composition).
 */
export const apiRoutes = new OpenAPIHono();
