import { Hono } from "hono";
import { MESSAGES } from "../configs/constants.ts";
import { exampleRoutes } from "./example.routes.ts";
import { successResponse } from "../utils/response.util.ts";

export const apiRoutes = new Hono();

apiRoutes.get("/health", (c) => {
  return successResponse(c, MESSAGES.HEALTH_OK, {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

apiRoutes.route("/examples", exampleRoutes);
