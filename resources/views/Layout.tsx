/** @jsxImportSource hono/jsx */
import { configApp } from "../../src/configs/app.config.ts";
import { getAsset, getStyle } from "../../src/utils/vite.util.ts";

interface LayoutProps {
  title?: string;
  children: any;
  withVue?: boolean;
}

/**
 * Main Layout (Base Template)
 * Supports both Pure SSR and Hybrid Vue SPA modes
 */
export const Layout = async ({ title = "Hono Skeleton", children, withVue = false }: LayoutProps) => {
  const isDev = configApp.isDevelopment;

  // Resolve Tailwind CSS and Vue assets
  const tailwindCss = isDev ? null : await getStyle("js/app.ts");
  const vueScript = withVue ? await getAsset("js/app.ts") : null;

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

        {/* Vue Bridge Script (Only if withVue={true}) */}
        {withVue && vueScript && <script type="module" src={vueScript}></script>}
      </head>
      <body class="bg-slate-50 text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-700">
        {children}
      </body>
    </html>
  );
};
