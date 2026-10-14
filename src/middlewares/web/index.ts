import { Hono } from "hono";
import { setupStaticAssets } from "./staticAssets.middleware.ts";

/**
 * Register Web-specific middlewares
 */
export const setupWebMiddlewares = (app: Hono) => {
  // 1. Static file serving (public files in all modes, Vite build in production)
  setupStaticAssets(app);

  // You can add Web-specific session or CSRF middlewares here in the future
};

// Re-export for easier access
export * from "./staticAssets.middleware.ts";
