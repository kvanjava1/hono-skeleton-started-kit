/** @jsxImportSource hono/jsx */
import { configApp } from "../../../src/configs/app.config.ts";
import { getAsset, getStyle } from "../../../src/utils/vite.util.ts";

interface LayoutProps {
  title?: string;
  children: any;
  withVue?: boolean;
}

/**
 * Main Layout Reusable
 * Digunakan untuk halaman murni SSR maupun halaman Bridge (Vue)
 */
export const MainLayout = async ({ title = "Hono Fullstack", children, withVue = false }: LayoutProps) => {
  const isDev = configApp.isDevelopment;

  // Di Dev, kita biarkan Vite meng-inject CSS secara dinamis melalui script module
  // Di Prod, kita gunakan link tag statis dari manifest
  const tailwindCss = isDev ? null : await getStyle("js/app.ts");

  // Script Vue hanya dimuat jika dibutuhkan
  const vueScript = withVue ? await getAsset("js/app.ts") : null;

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>

        {/* Vite HMR Client & CSS (Hanya Dev) */}
        {isDev && (
          <>
            <script type="module" src="http://localhost:5173/@vite/client"></script>
            <script type="module" dangerouslySetInnerHTML={{
              __html: `import "http://localhost:5173/css/app.css"`
            }} />
          </>
        )}
        
        {/* Tailwind CSS Entry (Hanya Prod) */}
        {!isDev && tailwindCss && <link rel="stylesheet" href={tailwindCss} />}

        {/* Vue Script (Optional) */}
        {withVue && vueScript && <script type="module" src={vueScript}></script>}
      </head>
      <body class="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
};
