import { Hono } from "hono";
import { MESSAGES } from "../../configs/constants.ts";
import { successResponse } from "../../utils/response.util.ts";
import { ROUTES } from "../../configs/routes.config.ts";
import { exampleApiRoutes } from "./example/index.ts";

export const apiRoutes = new Hono();

// Health check endpoint
apiRoutes.get(ROUTES.API.HEALTH, (c) => {
  return successResponse(c, MESSAGES.HEALTH_OK, {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Example CRUD routes
apiRoutes.route("/", exampleApiRoutes);
