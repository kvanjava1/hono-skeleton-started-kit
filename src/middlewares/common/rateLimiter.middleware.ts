import type { Context, Next } from "hono";
import { configApp, configRateLimiter } from "../../configs/index.ts";
import { HTTP_STATUS, MESSAGES } from "../../configs/constants.ts";
import { getRedis } from "../../database/redis.connection.ts";
import { errorResponse } from "../../utils/response.util.ts";
import { logger } from "../../utils/logger.util.ts";

const RATE_LIMIT_REDIS_PREFIX = "ratelimit:";

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitStore>();

const cleanupStore = (): void => {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetTime < now) {
      memoryStore.delete(key);
    }
  }
};

setInterval(cleanupStore, 60000);

const getWindowKey = (ip: string, windowMs: number, now: number): string => {
  const windowStart = Math.floor(now / windowMs) * windowMs;
  return `${RATE_LIMIT_REDIS_PREFIX}${ip}:${windowStart}`;
};

const checkRateLimitRedis = async (
  ip: string,
  windowMs: number,
  maxRequests: number,
  now: number,
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
  try {
    const redis = getRedis("redis1");
    const windowKey = getWindowKey(ip, windowMs, now);
    const resetTime = Math.floor(now / windowMs) * windowMs + windowMs;

    const count = await redis.incr(windowKey);

    if (count === 1) {
      await redis.pexpireat(windowKey, resetTime);
    }

    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
      resetTime,
    };
  } catch (error) {
    logger.error("[RateLimiter] Redis check failed, falling back to allow", error);
    return { allowed: true, remaining: maxRequests, resetTime: now + windowMs };
  }
};

const checkRateLimitMemory = (
  ip: string,
  windowMs: number,
  maxRequests: number,
  now: number,
): { allowed: boolean; remaining: number; resetTime: number } => {
  const record = memoryStore.get(ip);

  if (!record || record.resetTime < now) {
    const resetTime = now + windowMs;
    memoryStore.set(ip, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
};

export const rateLimiterMiddleware = async (
  c: Context,
  next: Next,
): Promise<void | Response> => {
  const ip =
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";

  const now = Date.now();
  const windowMs = configRateLimiter.windowMs;
  const maxRequests = configRateLimiter.max;

  const useRedis = configApp.db.redis;
  const result = useRedis
    ? await checkRateLimitRedis(ip, windowMs, maxRequests, now)
    : checkRateLimitMemory(ip, windowMs, maxRequests, now);

  c.header("X-RateLimit-Limit", String(maxRequests));
  c.header("X-RateLimit-Remaining", String(result.remaining));
  c.header("X-RateLimit-Reset", String(Math.ceil(result.resetTime / 1000)));

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - now) / 1000);
    logger.warn(`Rate limit exceeded for IP: ${ip}`);

    c.header("Retry-After", String(retryAfter));

    return errorResponse(
      c,
      MESSAGES.RATE_LIMIT_EXCEEDED,
      HTTP_STATUS.TOO_MANY_REQUESTS,
    );
  }

  await next();
};
