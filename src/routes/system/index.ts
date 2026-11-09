import { Hono } from "hono";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { configApp } from "../../configs/index.ts";
import { healthRoutes } from "./health/health.router.ts";
import { metricsRoutes } from "./metrics/metrics.router.ts";
import { createDocsRouter } from "./docs/docs.router.ts";

/**
 * System surface: operational endpoints that are not part of the API
 * contract (health probes, /metrics, /api/spec, /api/docs). Mounted from
 * src/routes/index.ts.
 *
 * The docs router is gated here at mount time: when API_DOCS_ENABLED is
 * false (the default) the routes are never registered, so production
 * answers a natural 404 — no reject middleware involved. The flag is read
 * once at registration; config resets require rebuilding the app.
 */
export const createSystemRoutes = (apiRoutes: OpenAPIHono): Hono => {
  const systemRoutes = new Hono();

  // Health probes (/api/health, /api/health/ready)
  systemRoutes.route("/", healthRoutes);

  // /metrics (Prometheus — runtime-gated by METRICS_ENABLED in the handler)
  systemRoutes.route("/", metricsRoutes);

  if (configApp.apiDocsEnabled) {
    systemRoutes.route("/", createDocsRouter(apiRoutes));
  }

  return systemRoutes;
};
