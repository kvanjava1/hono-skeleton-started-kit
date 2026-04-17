/** @jsxImportSource hono/jsx */
import type { Context } from "hono";

interface WelcomeProps {
  title?: string;
  initialData?: any;
}

// Cache manifest agar tidak membaca file berulang kali di produksi
let manifest: any = null;

/**
 * Helper untuk mengambil path aset (JS/CSS) dari manifest Vite
 */
const getAsset = async (key: string) => {
  const isProd = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod";
  
  if (!isProd) {
    // Di mode dev, kita langsung arahkan ke port Vite
    return `http://localhost:5173/${key}`;
  }

  if (!manifest) {
    try {
      const manifestPath = "./dist/.vite/manifest.json";
      manifest = await Bun.file(manifestPath).json();
    } catch (e) {
      console.error("❌ Vite manifest not found. Harap jalankan 'bun run build:client'");
      return "";
    }
  }

  return `/${manifest[key]?.file || ""}`;
};

/**
 * Helper untuk mengambil CSS dari manifest
 */
const getStyle = async (key: string) => {
  const isProd = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod";
  if (!isProd) return ""; // Vite menginject CSS secara dinamis di mode dev
  
  if (!manifest) return "";
  const cssFile = manifest[key]?.css?.[0];
  return cssFile ? `/${cssFile}` : "";
};

export const Welcome = async ({ title = "Hono + Vue Bridge", initialData = {} }: WelcomeProps) => {
  const isProd = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod";
  
  // Resolve Assets
  const mainScript = await getAsset("js/app.ts");
  const mainStyle = await getStyle("js/app.ts");

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        
        {!isProd && <script type="module" src="http://localhost:5173/@vite/client"></script>}
        
        {/* Load Main Script */}
        <script type="module" src={mainScript}></script>
        
        {/* Load CSS jika ada (Produksi) */}
        {mainStyle && <link rel="stylesheet" href={mainStyle} />}

        <script dangerouslySetInnerHTML={{ 
          __html: `window.__INITIAL_STATE__ = ${JSON.stringify(initialData)};` 
        }} />
      </head>
      <body class="bg-gray-50">
        <div id="app"></div>
      </body>
    </html>
  );
};

export const welcomeHandler = async (c: Context) => {
  const data = {
    serverTime: new Date().toISOString(),
    user: { name: "Melode", role: "Senior Developer" },
    message: "Halo! Ini adalah rute SSR yang memuat Vue."
  };
  return c.html(await Welcome({ title: "Welcome Page", initialData: data }));
};
