import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { ROUTES } from "../../../configs/routes.config.ts";
import {
  getHealth,
  getReadiness,
} from "../../../controllers/health/health.controller.ts";

export const healthRoutes = new OpenAPIHono();

healthRoutes.openapi(
  createRoute({
    method: "get",
    path: ROUTES.API.HEALTH,
    tags: ["Health"],
    summary: "Liveness check",
    description: "Returns 200 while the process is running.",
    responses: {
      200: { description: "Application is alive" },
    },
  }),
  getHealth,
);

healthRoutes.openapi(
  createRoute({
    method: "get",
    path: ROUTES.API.HEALTH_READY,
    tags: ["Health"],
    summary: "Readiness check",
    description:
      "Checks enabled dependencies. Returns 200 when all are up, 503 otherwise. " +
      "Each check has { name, status, latencyMs, error? }.",
    responses: {
      200: { description: "All enabled dependencies are up" },
      503: { description: "One or more enabled dependencies are down" },
    },
  }),
  getReadiness,
);
