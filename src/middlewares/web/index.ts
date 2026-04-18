import { Hono } from "hono";
import { setupSpaFallback } from "./spaFallback.ts";

/**
 * Register Web-specific middlewares
 */
export const setupWebMiddlewares = (app: Hono) => {
  // 1. Static file serving & SPA Fallback
  setupSpaFallback(app);

  // You can add Web-specific session or CSRF middlewares here in the future
};

// Re-export for easier access
export * from "./spaFallback.ts";
