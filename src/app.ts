import { Hono } from "hono";
import { setupMiddlewares } from "./middlewares/index.ts";
import { registerAllRoutes } from "./routes/index.ts";

const app = new Hono();

/**
 * 1. Global Middleware Setup
 * Includes Logger, CORS, Security Headers, and Static File serving (SPA Fallback)
 */
setupMiddlewares(app);

/**
 * 2. Route Registration
 * Includes API endpoints, SSR Web routes, and Global 404 handling
 */
registerAllRoutes(app);

export { app };
