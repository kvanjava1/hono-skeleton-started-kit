import { OpenAPIHono } from "@hono/zod-openapi";
import { healthRoutes } from "./health/health.router.ts";
import { metricsRoutes } from "./metrics/metrics.router.ts";
import { registerDocsRoutes } from "./docs/docs.router.ts";
import { exampleApiRoutes } from "./example/index.ts";

export const apiRoutes = new OpenAPIHono();

// Health routes (liveness + readiness)
apiRoutes.route("/", healthRoutes);

// Prometheus metrics (infra, excluded from rate limit and request logging)
apiRoutes.route("/", metricsRoutes);

// Example CRUD routes
apiRoutes.route("/", exampleApiRoutes);

// OpenAPI spec + Scalar UI
registerDocsRoutes(apiRoutes);
