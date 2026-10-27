import { Hono } from "hono";
import { configApp } from "../../../configs/index.ts";
import { HTTP_STATUS, MESSAGES } from "../../../configs/constants.ts";
import { errorResponse } from "../../../utils/response.util.ts";
import {
  metricsContentType,
  renderMetrics,
} from "../../../utils/metrics.util.ts";

export const metricsRoutes = new Hono();

metricsRoutes.get("/", async (c) => {
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
});
