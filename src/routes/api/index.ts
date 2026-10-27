import { OpenAPIHono } from "@hono/zod-openapi";
import { healthRoutes } from "./health/health.router.ts";
import { metricsRoutes } from "./metrics/metrics.router.ts";
import { createDocsRouter } from "./docs/docs.router.ts";
import { crudRoutes } from "./example/crud.router.ts";
import { ROUTES } from "../../configs/routes.config.ts";

export const apiRoutes = new OpenAPIHono();

// Health routes (/api/health, /api/health/ready)
apiRoutes.route(ROUTES.API.HEALTH, healthRoutes);

// Prometheus metrics (/metrics - excluded from rate limit and request logging)
apiRoutes.route(ROUTES.API.METRICS, metricsRoutes);

// Example CRUD routes (/api/example/cruds, /api/example/cruds/{id}, /api/example/cruds/job)
apiRoutes.route(ROUTES.API.EXAMPLE.CRUDS, crudRoutes);

// OpenAPI spec + Scalar UI (/api/spec, /api/docs)
apiRoutes.route(ROUTES.API.BASE_PATH, createDocsRouter(apiRoutes));
