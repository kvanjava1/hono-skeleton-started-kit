import { Hono } from "hono";
import { MESSAGES } from "../configs/constants.ts";
import { exampleRoutes } from "./example.routes.ts";
import { successResponse } from "../utils/response.util.ts";

export const registerAllRoutes = (app: Hono) => {
  const api = new Hono();

  api.get("/health", (c) => {
    return successResponse(c, MESSAGES.HEALTH_OK, {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  api.route("/examples", exampleRoutes);
  app.route("/api", api);
};
