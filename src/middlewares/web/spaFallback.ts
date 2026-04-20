import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { configApp } from "../../configs/app.config.ts";

/**
 * Middleware to handle static files in Production mode.
 * SPA navigation is explicitly handled in webRoutes.
 */
export const setupSpaFallback = (app: Hono) => {
  // Only serve static files from the dist folder in production mode
  if (configApp.isProduction) {
    app.use("/*", serveStatic({ root: "./dist" }));
  }

  // In development, serve static assets from the root public folder
  if (configApp.isDevelopment) {
    app.use("/*", serveStatic({ root: "./public" }));
  }
  
  // Note: Catch-all logic for /dashboard/* has been moved to src/routes/web/index.ts
};
