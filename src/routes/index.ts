import { Hono } from "hono";
import { apiRoutes } from "./api/index.ts";
import { webRoutes } from "./web/index.ts";
import { NotFoundError } from "../utils/errors.util.ts";
import { ROUTES } from "../configs/routes.config.ts";

/**
 * Register all application routes
 */
export const registerAllRoutes = (app: Hono) => {
  // 1. API Routes (JSON responses handled by individual absolute paths)
  app.route(ROUTES.API.ROOT, apiRoutes);

  // 2. Web Routes (SSR & Hybrid SPA Bridge)
  app.route(ROUTES.WEB.ROOT, webRoutes);

  // 3. Global 404 Handler (Placed after all routes are registered)
  app.notFound((c) => {
    // If the request is for an API endpoint
    if (c.req.path.startsWith(ROUTES.API.BASE_PATH)) {
      throw new NotFoundError(`API Endpoint ${c.req.path} not found`);
    }

    // For other web routes, throw a standard NotFoundError or render a custom 404 page
    throw new NotFoundError(`Page ${c.req.path} not found`);
  });
};
