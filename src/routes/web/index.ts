import { Hono } from "hono";
import { adminAuthWebRoutes } from "./admin/auth.router.ts";
import { adminUserWebRoutes } from "./admin/user.router.ts";
import { adminDashboardWebRoutes } from "./admin/dashboard.router.ts";
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

// Mount admin dashboard ("/admin"), auth ("/admin/login", "/admin/logout"), and
// User Management ("/admin/users...") — absolute registry paths, mounted
// at "/" like the system routers. "/" itself has no route by design
// (the example demo was removed; no replacement root page).
webRoutes.route(ROUTES.WEB.ROOT, adminDashboardWebRoutes);
webRoutes.route(ROUTES.WEB.ROOT, adminAuthWebRoutes);
webRoutes.route(ROUTES.WEB.ROOT, adminUserWebRoutes);
