import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { MESSAGES } from "../../configs/constants.ts";
import { successResponse } from "../../utils/response.util.ts";
import { ROUTES } from "../../configs/routes.config.ts";
import { exampleApiRoutes } from "./example/index.ts";

export const apiRoutes = new OpenAPIHono();

// Health check endpoint
apiRoutes.get(ROUTES.API.HEALTH, (c) => {
  return successResponse(c, MESSAGES.HEALTH_OK, {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// OpenAPI spec (JSON)
apiRoutes.doc("/api/spec", {
  openapi: "3.0.0",
  info: { title: "Hono Multi-DB API", version: "1.0.0" },
});

// Scalar API docs (UI)
apiRoutes.get("/api/docs", apiReference({ spec: { url: "/api/spec" } }));

// Example CRUD routes
apiRoutes.route("/", exampleApiRoutes);
