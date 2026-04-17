import { Hono } from "hono";
import { welcomeHandler } from "../../../resources/views/Welcome.tsx";
import { aboutHandler } from "../../../resources/views/About.tsx";

export const webRoutes = new Hono();

/**
 * Web / SSR Routes
 * Komponen ini menangani rute yang merender HTML via Hono JSX (The Bridge)
 */

// Home: Hybrid SSR + Vue Bridge
webRoutes.get("/", welcomeHandler);

// About: Pure SSR (No Vue)
webRoutes.get("/about", aboutHandler);

// Tambahkan rute web lainnya di sini...
