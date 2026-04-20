/** @jsxImportSource hono/jsx */
import { configApp } from "../../../src/configs/app.config.ts";
import { getStyle } from "../../../src/utils/vite.util.ts";
import { ROUTES } from "../../../src/configs/routes.config.ts";

interface IndexPageProps {
  title?: string;
  serverData?: {
    appName: string;
    runtime: string;
    features: string[];
  };
}

/**
 * Index Component (Pure SSR - Template-less)
 * Example of a landing page 100% managed by the server without using Layout component
 */
export const IndexPage = async ({
  title = "Welcome | Pure SSR Mode",
  serverData = { appName: "Hono Skeleton", runtime: "Bun", features: [] }
}: IndexPageProps) => {
  const isDev = configApp.isDevelopment;

  // Resolve Tailwind CSS for production
  const tailwindCss = isDev ? null : await getStyle("js/app.ts");

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
      </head>
      <body class="bg-slate-50 text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-700">
        <main class="min-h-screen flex flex-col items-center justify-center p-6 bg-radial-gradient">
          <div class="max-w-4xl w-full text-center">
            <div class="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 rounded-full">
              Hono SSR Mode Active (Template-less)
            </div>

            <h1 class="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight">
              Performance Without <br />
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Compromise.</span>
            </h1>

            <p class="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              This is an example of an Index page using 100% Server-side Rendering.
              Running on <span class="font-mono text-indigo-600 font-bold">{serverData.runtime}</span> for <span class="text-slate-900 font-semibold">{serverData.appName}</span>.
              <br />
              <strong> Features:</strong> {serverData.features.join(", ")}
            </p>

            <div class="flex flex-wrap items-center justify-center gap-4">
              <a href={ROUTES.WEB.EXAMPLE.EXAMPLE1} class="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200">
                Go to Vue Example 1
              </a>
              <a href="/about" class="px-8 py-4 bg-white text-slate-900 font-bold border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">
                Learn More
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
};

