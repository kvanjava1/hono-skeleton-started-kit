import { Hono } from "hono";
import { indexVueHandler } from "../../../resources/views/IndexVue.tsx";
import { indexHandler } from "../../../resources/views/Index.tsx";

export const webRoutes = new Hono();

/**
 * Web Routing Configuration
 */

// 1. Pure SSR Landing Page
webRoutes.get("/", indexHandler);

// 2. Vue SPA Entry Point (Mounted at /dashboard)
// Every path starting with /dashboard will be handled by the same Vue Shell
webRoutes.get("/dashboard", indexVueHandler);
webRoutes.get("/dashboard/*", indexVueHandler);
