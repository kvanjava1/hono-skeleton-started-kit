import { Hono } from "hono";
import { MESSAGES } from "../../configs/constants.ts";
import { successResponse } from "../../utils/response.util.ts";
import { exampleRoutes } from "./example.routes.ts";

export const apiRoutes = new Hono();

// Health check endpoint
apiRoutes.get("/health", (c) => {
  return successResponse(c, MESSAGES.HEALTH_OK, {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Module routes
apiRoutes.route("/examples", exampleRoutes);
