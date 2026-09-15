import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { configApp } from "../../configs/index.ts";
import { ROUTES } from "../../configs/routes.config.ts";
import { getContext } from "../../utils/context.util.ts";
import {
  classifyRequestKind,
  httpRequestDurationMs,
  httpRequestsTotal,
  normalizeRoutePath,
} from "../../utils/metrics.util.ts";
import { transformError } from "./errorHandler.ts";

export const metricsMiddleware = async (
  c: Context,
  next: Next,
): Promise<void> => {
  if (!configApp.metricsEnabled || c.req.path === ROUTES.API.METRICS) {
    await next();
    return;
  }

  const start = getContext()?.requestStartedAt ?? Date.now();
  const method = c.req.method;
  let status = 500;

  try {
    await next();
    status = c.res.status;
  } catch (error) {
    const normalized = transformError(error);
    status = normalized instanceof HTTPException ? normalized.status : 500;
    throw error;
  } finally {
    const path = normalizeRoutePath(c.req.routePath);
    const kind = classifyRequestKind(c.req.path, ROUTES.API.BASE_PATH);
    httpRequestsTotal.inc({ method, path, status: String(status), kind });
    httpRequestDurationMs.observe({ method, path, kind }, Date.now() - start);
  }
};
