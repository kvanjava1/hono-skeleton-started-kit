import { Hono } from "hono";
import { ROUTES } from "../../../configs/routes.config.ts";
import {
  getHealth,
  getReadiness,
} from "../../../controllers/system/health.controller.ts";

const HEALTH = ROUTES.SYSTEM.HEALTH;

/**
 * Health probes (/api/health, /api/health/ready).
 * Operational surface, not part of the OpenAPI contract — plain Hono with
 * absolute registry paths (system routers are mounted at "/").
 */
export const healthRoutes = new Hono();

healthRoutes.get(HEALTH.LIVENESS, getHealth);
healthRoutes.get(HEALTH.READY, getReadiness);
