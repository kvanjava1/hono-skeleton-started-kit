import type { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { configCors } from "../configs/index.ts";
import { requestId } from "hono/request-id";
import { compress } from "hono/compress";
import { errorHandler } from "./errorHandler.middleware.ts";
import { rateLimiterMiddleware } from "./rateLimiter.middleware.ts";
import { requestLoggerMiddleware } from "./logger.middleware.ts";
import { jsonOnlyMiddleware } from "./contentType.middleware.ts";
import { contextMiddleware } from "./context.middleware.ts";

export { errorHandler } from "./errorHandler.middleware.ts";
export { rateLimiterMiddleware } from "./rateLimiter.middleware.ts";
export { requestLoggerMiddleware } from "./logger.middleware.ts";
export { jsonOnlyMiddleware } from "./contentType.middleware.ts";

export const setupMiddlewares = (app: Hono) => {
  app.use("*", requestId());
  app.use("*", contextMiddleware);
  app.use("*", compress());
  app.use(
    "*",
    cors({
      origin: configCors.origin,
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use("*", secureHeaders());
  app.use("*", jsonOnlyMiddleware);
  app.use("*", rateLimiterMiddleware);
  app.use("*", requestLoggerMiddleware);

  // Global Error Handler
  app.onError(errorHandler);
};
