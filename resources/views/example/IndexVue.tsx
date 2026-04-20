/** @jsxImportSource hono/jsx */
import type { Context } from "hono";
import { configApp } from "../../../src/configs/app.config.ts";
import { getAsset, getStyle } from "../../../src/utils/vite.util.ts";

interface IndexVueProps {
  title?: string;
  initialState?: any;
}

/**
 * IndexVue Component (The Bridge - Template-less)
 * Serves as the "Shell" for the Vue SPA application without using Layout component
 */
export const IndexVue = async ({ title = "Dashboard | Vue SPA", initialState = {} }: IndexVueProps) => {
  const isDev = configApp.isDevelopment;

  // Resolve Tailwind CSS and Vue assets
  const tailwindCss = isDev ? null : await getStyle("js/app.ts");
  const vueScript = await getAsset("js/app.ts");

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>

        {/* Vite Dev Tools & CSS (Development mode only) */}
        {isDev && (
          <>
            <script type="module" src="http://localhost:5173/@vite/client"></script>
            <script type="module" dangerouslySetInnerHTML={{
              __html: `import "http://localhost:5173/css/app.css"`
            }} />
          </>
        )}

        {/* Tailwind CSS (Production mode only) */}
        {!isDev && tailwindCss && <link rel="stylesheet" href={tailwindCss} />}

        {/* Vue Bridge Script */}
        {vueScript && <script type="module" src={vueScript}></script>}
      </head>
      <body class="bg-slate-50 text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-700">
        {/* Hydration: Passing server-side data to the client-side window object */}
        <script dangerouslySetInnerHTML={{
          __html: `window.__INITIAL_STATE__ = ${JSON.stringify(initialState)};`
        }} />

        {/* Vue.js mounting point */}
        <div id="app"></div>
      </body>
    </html>
  );
};

