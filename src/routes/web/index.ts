import { Hono } from "hono";
import { exampleCrudWebRoutes } from "./example/crud.router.ts";
import { ROUTES } from "../../configs/routes.config.ts";

export const webRoutes = new Hono();

/**
 * Web Routing Configuration
 * Mount modular web routers here.
 *
 * Web pages are Inertia.js + Vue pages (see docs/standards/inertia-patterns.md).
 */

// Mount the Inertia + Vue CRUD demo at the web root ("/", "/cruds/:id/edit", ...)
webRoutes.route(ROUTES.WEB.ROOT, exampleCrudWebRoutes);
