import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { configApp } from "../configs/app.config.ts";
import { Welcome } from "../views/Welcome.tsx";

export const setupSpaFallback = (app: Hono) => {
  // Hanya layani file statis dari dist jika di mode produksi
  if (configApp.isProduction) {
    app.use("/*", serveStatic({ root: "./dist" }));
  }

  // SPA specific catch-all fallback (Aktif di Dev & Prod)
  app.get("*", async (c, next) => {
    // Jika request API atau sudah ada handler-nya, biarkan lewat
    if (c.req.path.startsWith("/api/")) {
      return next();
    }

    // Alih-alih 404, kita berikan "Shell" SPA via Welcome component
    try {
      return c.html(await Welcome({ title: "Hono Vue App" }));
    } catch (e) {
      return next();
    }
  });
};
