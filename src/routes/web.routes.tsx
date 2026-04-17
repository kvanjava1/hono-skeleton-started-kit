import { Hono } from "hono";
import { welcomeHandler } from "../views/Welcome.tsx";

export const webRoutes = new Hono();

// SSR Blade-like fallback endpoint testing
webRoutes.get("/welcome", welcomeHandler);
// You can add more JSX routes here...
