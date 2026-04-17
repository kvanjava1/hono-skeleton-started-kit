import { Hono } from "hono";
import { welcomeHandler } from "../../views/Welcome.tsx";

export const webRoutes = new Hono();

/**
 * Web / SSR Routes
 * Komponen ini menangani rute yang merender HTML via Hono JSX (The Bridge)
 */
webRoutes.get("/welcome", welcomeHandler);

// Tambahkan rute web lainnya di sini...
