import type { Context } from "hono";
import { configApp } from "../../configs/index.ts";
import { HTTP_STATUS, MESSAGES } from "../../configs/constants.ts";
import { errorResponse } from "../../utils/response.util.ts";
import {
  metricsContentType,
  renderMetrics,
} from "../../utils/metrics.util.ts";

/**
 * Prometheus metrics endpoint (/metrics).
 * Gated by METRICS_ENABLED, optionally protected by the x-metrics-token header.
 */
export const getMetrics = async (c: Context) => {
  if (!configApp.metricsEnabled) {
    return errorResponse(c, MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  const token = configApp.metricsToken;
  if (token && c.req.header("x-metrics-token") !== token) {
    return errorResponse(
      c,
      MESSAGES.METRICS_UNAUTHORIZED,
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  c.header("Content-Type", metricsContentType);
  return c.body(await renderMetrics());
};
