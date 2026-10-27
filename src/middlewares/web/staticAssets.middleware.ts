import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { configApp } from "../../configs/app.config.ts";

/**
 * Middleware to handle static files and assets.
 * All public assets (static assets and compiled Vite artifacts) are served from ./public.
 */
export const setupStaticAssets = (app: Hono) => {
  // Cache Vite build artifacts with immutable headers in production (they contain unique content hashes)
  if (configApp.isProduction()) {
    app.use("/build/*", async (c, next) => {
      await next();
      c.header("Cache-Control", "public, max-age=31536000, immutable");
    });
  }

  // Serve all public assets from the single root ./public directory
  app.use("/*", serveStatic({ root: "./public" }));
};
