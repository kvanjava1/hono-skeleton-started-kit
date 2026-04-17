import { Hono } from "hono";
import { apiRoutes } from "./api.routes.ts";
import { webRoutes } from "./web.routes.tsx";

export const registerAllRoutes = (app: Hono) => {
  // Register web routes directly on root
  app.route("/", webRoutes);

  // Register api routes under /api
  app.route("/api", apiRoutes);
};
