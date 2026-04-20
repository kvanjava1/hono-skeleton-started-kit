import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { configApp } from "../../configs/app.config.ts";

/**
 * Middleware to handle static files and assets.
 * 1. In Production: Serves bundled assets from ./dist
 * 2. In Development: Serves raw assets from ./public
 */
export const setupStaticAssets = (app: Hono) => {
  // Only serve static files from the dist folder in production mode
  if (configApp.isProduction) {
    app.use("/*", serveStatic({ root: "./dist" }));
  }

  // In development, serve static assets from the root public folder
  if (configApp.isDevelopment) {
    app.use("/*", serveStatic({ root: "./public" }));
  }
};
