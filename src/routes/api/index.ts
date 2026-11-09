import { OpenAPIHono } from "@hono/zod-openapi";
import { crudRoutes } from "./example/crud.router.ts";

export const apiRoutes = new OpenAPIHono();

// Domain routers define ABSOLUTE paths from ROUTES.API and are therefore
// mounted at "/" — @hono/zod-openapi composes the spec path from the mount
// prefix, so any non-"/" mount would duplicate the prefix.

// Example CRUD routes (/api/example/cruds, /api/example/cruds/{id}, /api/example/cruds/job)
apiRoutes.route("/", crudRoutes);
