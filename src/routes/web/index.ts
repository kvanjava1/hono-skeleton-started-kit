import { Hono } from "hono";
import { exampleLoadViewRoutes } from "./example/loadView.router.ts";
import { renderLandingPage } from "../../controllers/example/loadView.controller.ts";
import { ROUTES } from "../../configs/routes.config.ts";

export const webRoutes = new Hono();

/**
 * Web Routing Configuration
 * Mount modular web routers here.
 */

// Mount Example View Routes
webRoutes.get("/", renderLandingPage);
webRoutes.route(ROUTES.WEB.EXAMPLE.LANDING, exampleLoadViewRoutes);
