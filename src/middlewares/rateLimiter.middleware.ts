import type { Context, Next } from "hono";
import { configRateLimiter } from "../configs/index.ts";
import { HTTP_STATUS, MESSAGES } from "../configs/constants.ts";
import { errorResponse } from "../utils/response.util.ts";
import { logger } from "../utils/logger.util.ts";

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitStore>();

const cleanupStore = (): void => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
};

setInterval(cleanupStore, 60000);

export const rateLimiterMiddleware = async (
  c: Context,
  next: Next,
): Promise<void | Response> => {
  const ip =
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";

  const now = Date.now();
  const windowMs = configRateLimiter.windowMs;
  const maxRequests = configRateLimiter.max;

  const record = rateLimitStore.get(ip);

  if (!record || record.resetTime < now) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
  } else if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    logger.warn(`Rate limit exceeded for IP: ${ip}`);

    c.header("Retry-After", String(retryAfter));
    c.header("X-RateLimit-Limit", String(maxRequests));
    c.header("X-RateLimit-Remaining", "0");
    c.header("X-RateLimit-Reset", String(record.resetTime));

    return errorResponse(
      c,
      MESSAGES.RATE_LIMIT_EXCEEDED,
      HTTP_STATUS.TOO_MANY_REQUESTS,
    );
  } else {
    record.count++;
  }

  const remaining = maxRequests - (rateLimitStore.get(ip)?.count || 0);
  c.header("X-RateLimit-Limit", String(maxRequests));
  c.header("X-RateLimit-Remaining", String(Math.max(0, remaining)));
  c.header("X-RateLimit-Reset", String(rateLimitStore.get(ip)?.resetTime || 0));

  await next();
};
