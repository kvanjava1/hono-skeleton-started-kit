import { Hono } from "hono";
import { renderLandingPage, renderDashboard } from "../../../controllers/example/exampleLoadView.controller.ts";

export const exampleLoadViewRoutes = new Hono();

/**
 * Web Routing Configuration for Example Load View
 */

// 1. Pure SSR Landing Page
exampleLoadViewRoutes.get("/", renderLandingPage);

// 2. Vue SPA Entry Point (Mounted at /dashboard)
exampleLoadViewRoutes.get("/dashboard", renderDashboard);
exampleLoadViewRoutes.get("/dashboard/*", renderDashboard);
