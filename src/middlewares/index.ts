import { Hono } from "hono";
import { setupCommonMiddlewares, errorHandler } from "./common/index.ts";
import { setupApiMiddlewares } from "./api/index.ts";
import { setupWebMiddlewares } from "./web/index.ts";

// Re-exporting everything for convenience and backward compatibility
export * from "./common/index.ts";
export * from "./api/index.ts";
export * from "./web/index.ts";

/**
 * Main middleware entry point.
 * Dispatches middlewares based on the request path (API vs Web).
 */
export const setupMiddlewares = (app: Hono) => {
  // 1. Global / Common Middlewares (requestId, logger, compress, etc.)
  setupCommonMiddlewares(app);

  // 2. API Specific Middlewares (cors, jsonOnly)
  // These are strictly applied to /api/* paths
  setupApiMiddlewares(app);

  // 3. Web Specific Middlewares (static files, spa fallback)
  setupWebMiddlewares(app);
  
  // 4. Global Error Handler
  app.onError(errorHandler);
};
