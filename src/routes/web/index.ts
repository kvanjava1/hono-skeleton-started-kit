import { Hono } from "hono";
import { exampleCrudWebRoutes } from "./example/crud.router.ts";
import { ROUTES } from "../../configs/routes.config.ts";
import { webSessionMiddleware } from "../../middlewares/web/session.middleware.ts";

export const webRoutes = new Hono();

/**
 * Web Routing Configuration
 * Mount modular web routers here.
 *
 * Web pages are Inertia.js + Svelte pages (see docs/standards/inertia-patterns.md).
 */

// Session middleware runs for every web request (API paths pass through);
// it must be registered before the routers so handlers and the CSRF guard
// can read `c.get("webSession")`.
webRoutes.use("*", webSessionMiddleware);

// Mount the Inertia + Svelte CRUD demo at the web root ("/", "/cruds/:id/edit", ...)
webRoutes.route(ROUTES.WEB.ROOT, exampleCrudWebRoutes);
