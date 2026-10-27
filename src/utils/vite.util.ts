import { html } from "hono/html";
import { configApp } from "../configs/app.config.ts";
import { logger } from "./logger.util.ts";

const cssEntry = "css/app.css";

/**
 * Get the active Vite Dev Server base URL.
 * Defaults to http://localhost:5173, configurable via VITE_DEV_SERVER_URL.
 */
export const getViteDevServer = (): string => {
  return process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
};

type ManifestEntry = {
  file?: string;
  css?: string[];
  src?: string;
};

let manifest: Record<string, ManifestEntry> | null = null;

/**
 * Resolve the compiled stylesheet URL for development or production.
 */
export const getStyle = async (): Promise<string> => {
  if (configApp.isDevelopment()) {
    return `${getViteDevServer()}/${cssEntry}`;
  }

  let currentManifest = manifest;
  if (!currentManifest) {
    try {
      const manifestFile = Bun.file("./public/build/.vite/manifest.json");
      if (await manifestFile.exists()) {
        currentManifest = await manifestFile.json();
      } else {
        currentManifest = await Bun.file("./public/build/manifest.json").json();
      }
      manifest = currentManifest;
    } catch {
      logger.error("Vite manifest not found. Run 'bun run build:css' first.");
      return "";
    }
  }

  if (!currentManifest) {
    logger.error("Vite manifest is empty. Run 'bun run build:css' first.");
    return "";
  }

  const resolvedManifest = currentManifest;
  const entry = resolvedManifest[cssEntry] ?? Object.values(resolvedManifest).find(
    (asset) => asset.src === cssEntry || asset.src?.endsWith(`/${cssEntry}`),
  );
  const stylesheet = entry?.file?.endsWith(".css")
    ? entry.file
    : entry?.css?.[0];

  if (!stylesheet) {
    logger.error(`Vite manifest does not contain the ${cssEntry} stylesheet.`);
    return "";
  }

  return `/build/${stylesheet}`;
};

/**
 * Reusable Vite Head tags component for Hono JSX views.
 * Automatically handles stylesheet link and dev server HMR client script.
 */
export const ViteHead = async () => {
  const isDev = configApp.isDevelopment();
  const stylesheet = await getStyle();
  const devServer = getViteDevServer();

  return html`
    ${stylesheet ? html`<link rel="stylesheet" href="${stylesheet}" />` : ""}
    ${isDev ? html`<script type="module" src="${devServer}/@vite/client"></script>` : ""}
  `;
};
