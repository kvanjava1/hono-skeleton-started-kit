import { Hono } from "hono";
import { MESSAGES } from "../../configs/constants.ts";
import { successResponse } from "../../utils/response.util.ts";
import { exampleRoutes } from "./example/crudWithJob.routes.ts";
import { ROUTES } from "../../configs/routes.config.ts";

export const apiRoutes = new Hono();

// Health check endpoint
apiRoutes.get(ROUTES.API.HEALTH, (c) => {
  return successResponse(c, MESSAGES.HEALTH_OK, {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Module routes
apiRoutes.route(ROUTES.API.EXAMPLE.BASE, exampleRoutes);
