import { OpenAPIHono } from "@hono/zod-openapi";
import { healthRoutes } from "./health/health.router.ts";
import { crudRoutes } from "./example/crud.router.ts";

export const apiRoutes = new OpenAPIHono();

// Domain routers define ABSOLUTE paths from ROUTES.API and are therefore
// mounted at "/" — @hono/zod-openapi composes the spec path from the mount
// prefix, so any non-"/" mount would duplicate the prefix.

// Health routes (/api/health, /api/health/ready)
apiRoutes.route("/", healthRoutes);

// Example CRUD routes (/api/example/cruds, /api/example/cruds/{id}, /api/example/cruds/job)
apiRoutes.route("/", crudRoutes);
