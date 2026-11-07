import { serializePage, type RootView } from "@hono/inertia";
import { configApp } from "../../../src/configs/app.config.ts";
import {
  getStyle,
  getScriptEntry,
  getViteDevServer,
} from "../../../src/utils/vite.util.ts";

/**
 * Root view for Inertia pages (the HTML shell that boots the Vue SPA).
 * All page content is rendered client-side by Vue; this shell only carries:
 * - the compiled stylesheet (Vite manifest in prod, dev server in dev)
 * - the Vite HMR client (dev only)
 * - the serialized Inertia page object (`data-page="app"`)
 * - the Inertia client bootstrap module
 *
 * `serializePage` escapes the page object (`/` -> `\/`) so props containing
 * `</script>` cannot break out of the JSON script tag (per @hono/inertia).
 */
export const inertiaRootView: RootView = async (page) => {
  const isDev = configApp.isDevelopment();
  const stylesheet = await getStyle();
  // Page names are app-namespaced (`<appName>/<PagePath>`) — the app prefix
  // selects which client app bootstrap entry this shell must load.
  const appName = page.component.split("/")[0] ?? "";
  const script = await getScriptEntry(appName);

  const head = [
    stylesheet ? `<link rel="stylesheet" href="${stylesheet}" />` : "",
    isDev
      ? `<script type="module" src="${getViteDevServer()}/@vite/client"></script>`
      : "",
  ]
    .filter(Boolean)
    .join("\n    ");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${head}
  </head>
  <body class="bg-slate-50 text-slate-900 antialiased">
    <script data-page="app" type="application/json">${serializePage(page)}</script>
    <div id="app"></div>
    <script type="module" src="${script}"></script>
  </body>
</html>`;
};
