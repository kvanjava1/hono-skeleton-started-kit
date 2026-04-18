import { Hono } from "hono";
import { cors } from "hono/cors";
import { configCors } from "../../configs/index.ts";
import { jsonOnlyMiddleware } from "./contentType.middleware.ts";

/**
 * Register API-specific middlewares with path filtering
 */
export const setupApiMiddlewares = (app: Hono) => {
  // 1. API CORS Configuration (Only for /api/*)
  app.use(
    "/api/*",
    cors({
      origin: configCors.origin,
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // 2. Enforce JSON Content-Type (Only for /api/*)
  app.use("/api/*", jsonOnlyMiddleware);
};

// Re-export for easier access
export * from "./contentType.middleware.ts";
