import { Hono } from "hono";
import { apiRoutes } from "./api/index.ts";
import { webRoutes } from "./web/index.ts";

/**
 * Main Route Register
 * Menggabungkan semua rute Web (SSR) dan API ke dalam aplikasi
 */
export const registerAllRoutes = (app: Hono) => {
  // Register web routes directly on root (/)
  app.route("/", webRoutes);

  // Register api routes under /api prefix
  app.route("/api", apiRoutes);
};
