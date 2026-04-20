import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { configApp } from "../../configs/app.config.ts";

/**
 * Middleware to handle static files and assets.
 * - ./public is served in both Development and Production.
 * - ./dist is served only in Production (bundled assets).
 */
export const setupStaticAssets = (app: Hono) => {
  // Always serve static assets from the root public folder
  app.use("/*", serveStatic({ root: "./public" }));

  // Additionally serve from dist folder in production mode
  if (configApp.isProduction) {
    app.use("/*", serveStatic({ root: "./dist" }));
  }
};
