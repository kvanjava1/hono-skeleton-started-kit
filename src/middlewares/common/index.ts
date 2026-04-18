import { Hono } from "hono";
import { requestId } from "hono/request-id";
import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
import { contextMiddleware } from "./context.middleware.ts";
import { requestLoggerMiddleware } from "./logger.middleware.ts";
import { rateLimiterMiddleware } from "./rateLimiter.middleware.ts";

/**
 * Register common middlewares shared by both API and Web
 */
export const setupCommonMiddlewares = (app: Hono) => {
  app.use("*", requestId());
  app.use("*", contextMiddleware);
  app.use("*", compress());
  app.use("*", secureHeaders());
  app.use("*", rateLimiterMiddleware);
  app.use("*", requestLoggerMiddleware);
};

// Re-export common middlewares
export * from "./context.middleware.ts";
export * from "./logger.middleware.ts";
export * from "./rateLimiter.middleware.ts";
export * from "./errorHandler.ts";
