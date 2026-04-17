/** @jsxImportSource hono/jsx */
import type { Context } from "hono";
import { configApp } from "../configs/app.config.ts";
import { getAsset, getStyle } from "../utils/vite.util.ts";

interface WelcomeProps {
  title?: string;
  initialData?: any;
}

/**
 * Welcome Component (The Bridge)
 * Bertindak sebagai shell HTML untuk memuat aplikasi Vue.js
 */
export const Welcome = async ({ title = "Hono + Vue Bridge", initialData = {} }: WelcomeProps) => {
  // Resolve Assets menggunakan utility terpusat
  const mainScript = await getAsset("js/app.ts");
  const mainStyle = await getStyle("js/app.ts");

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        
        {/* Inject Vite HMR Client (hanya dev) */}
        {configApp.isDevelopment && <script type="module" src="http://localhost:5173/@vite/client"></script>}
        
        {/* Load Main Entry Script */}
        <script type="module" src={mainScript}></script>
        
        {/* Load CSS bundle (hanya prod, dev di-inject otomatis oleh Vite) */}
        {mainStyle && <link rel="stylesheet" href={mainStyle} />}

        {/* Transfer Server-side data to Client-side Vue */}
        <script dangerouslySetInnerHTML={{ 
          __html: `window.__INITIAL_STATE__ = ${JSON.stringify(initialData)};` 
        }} />
      </head>
      <body class="bg-gray-50">
        {/* Vue Mount Point */}
        <div id="app"></div>
      </body>
    </html>
  );
};

/**
 * Handler untuk rute /welcome
 */
export const welcomeHandler = async (c: Context) => {
  const data = {
    serverTime: new Date().toISOString(),
    user: { name: "Melode", role: "Senior Developer" },
    message: "Halo! Data ini dikirim secara SSR dan dikonsumsi oleh Vue."
  };
  
  return c.html(await Welcome({ 
    title: "Welcome Page | Hono-Vue Bridge", 
    initialData: data 
  }));
};
