import { Hono } from "hono";
import { inertia } from "@hono/inertia";
import { setupStaticAssets } from "./staticAssets.middleware.ts";
import { configApp } from "../../configs/app.config.ts";
import { getAssetVersion, getSharedProps } from "../../utils/inertia.util.ts";
import { inertiaRootView } from "../../../resources/views/inertia/AppShell.tsx";

/**
 * Register Web-specific middlewares
 */
export const setupWebMiddlewares = (app: Hono) => {
  // 1. Static file serving (public files in all modes, Vite build in production)
  setupStaticAssets(app);

  // 2. Inertia protocol middleware (official @hono/inertia).
  //    Adds c.render(component, props) for web controllers: full HTML shell on
  //    first visit, JSON page object when the request carries X-Inertia.
  //    - version: Vite manifest hash (changes per build -> 409 + full reload)
  //    - rootView: resources/views/inertia/AppShell.tsx (Hono JSX-style shell)
  //    - share: global props merged into every Inertia page
  //    The middleware is a pass-through for non-Inertia traffic (API routes,
  //    JSX SSR pages are untouched); it only decorates c.render() calls.
  app.use(
    "*",
    inertia({
      version: getAssetVersion(),
      rootView: inertiaRootView,
      share: () => getSharedProps(),
    }),
  );

  // Session/CSRF middlewares are planned for Phase 2
  // (see plans/inertia-vue-integration/phase-1/ideas/03-session-csrf-error-bag.md).
};

// Re-export for easier access
export * from "./staticAssets.middleware.ts";
export { sameOriginGuard } from "./sameOrigin.middleware.ts";
