import { Hono } from "hono";
import { apiRoutes } from "./api/index.ts";
import { webRoutes } from "./web/index.ts";
import { NotFoundError } from "../utils/errors.util.ts";
import { ROUTES } from "../configs/routes.config.ts";

/**
 * Register all application routes
 */
export const registerAllRoutes = (app: Hono) => {
  app.route("/", apiRoutes);
  app.route("/", webRoutes);
  
  app.notFound((c) => {
    if (c.req.path.startsWith(ROUTES.API.BASE_PATH)) {
      throw new NotFoundError(`API Endpoint ${c.req.path} not found`);
    }

    throw new NotFoundError(`Page ${c.req.path} not found`);
  });
};
