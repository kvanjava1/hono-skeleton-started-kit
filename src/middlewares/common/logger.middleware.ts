import type { Context, Next } from "hono";
import { ROUTES } from "../../configs/routes.config.ts";
import { getContext } from "../../utils/context.util.ts";
import { logger } from "../../utils/logger.util.ts";

export const requestLoggerMiddleware = async (
  c: Context,
  next: Next,
): Promise<void> => {
  if (c.req.path === ROUTES.API.METRICS) {
    await next();
    return;
  }

  const start = getContext()?.requestStartedAt ?? Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const ip =
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";

  await next();

  const durationMs = Date.now() - start;
  const status = c.res.status;

  logger.info("[Http] Request completed", {
    method,
    path,
    status,
    durationMs,
    ip,
  });
};
