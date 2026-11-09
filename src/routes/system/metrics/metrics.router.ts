import { Hono } from "hono";
import { ROUTES } from "../../../configs/routes.config.ts";
import { getMetrics } from "../../../controllers/system/metrics.controller.ts";

export const metricsRoutes = new Hono();

// Absolute path from the registry — system routers are mounted at "/".
metricsRoutes.get(ROUTES.SYSTEM.METRICS, getMetrics);
