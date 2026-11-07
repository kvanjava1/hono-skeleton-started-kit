import { html } from "hono/html";
import { configApp } from "../configs/app.config.ts";
import { logger } from "./logger.util.ts";

const cssEntry = "css/app.css";

type ManifestEntry = {
  file?: string;
  css?: string[];
  src?: string;
};

let manifest: Record<string, ManifestEntry> | null = null;

/**
 * Load and cache the Vite build manifest (production builds only).
 * Returns null when the manifest cannot be found or parsed.
 */
export const loadViteManifest = async (): Promise<
  Record<string, ManifestEntry> | null
> => {
  if (manifest) return manifest;
  try {
    const manifestFile = Bun.file("./public/build/.vite/manifest.json");
    if (await manifestFile.exists()) {
      manifest = await manifestFile.json();
    } else {
      manifest = await Bun.file("./public/build/manifest.json").json();
    }
  } catch {
    logger.error("Vite manifest not found. Run 'bun run build:assets' first.");
    return null;
  }
  return manifest;
};

const resolveManifestEntry = (
  currentManifest: Record<string, ManifestEntry>,
  entryKey: string,
): ManifestEntry | undefined => {
  return currentManifest[entryKey] ?? Object.values(currentManifest).find(
    (asset) => asset.src === entryKey || asset.src?.endsWith(`/${entryKey}`),
  );
};

/**
 * Get the active Vite Dev Server base URL.
 * Defaults to http://localhost:5173, configurable via VITE_DEV_SERVER_URL.
 */
export const getViteDevServer = (): string => {
  return process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
};

/**
 * Resolve the compiled stylesheet URL for development or production.
 */
export const getStyle = async (): Promise<string> => {
  if (configApp.isDevelopment()) {
    return `${getViteDevServer()}/${cssEntry}`;
  }

  const currentManifest = await loadViteManifest();
  if (!currentManifest) {
    logger.error("Vite manifest is empty. Run 'bun run build:assets' first.");
    return "";
  }

  const entry = resolveManifestEntry(currentManifest, cssEntry);
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
 * Resolve the Inertia client entry bundle URL for a given client app.
 * Each client app owns its bootstrap at `resources/js/apps/<appName>/app.ts`.
 * Development: module served directly by the Vite dev server (HMR).
 * Production: hashed bundle resolved from the Vite manifest.
 */
export const getScriptEntry = async (appName: string): Promise<string> => {
  const scriptEntry = `js/apps/${appName}/app.ts`;

  if (configApp.isDevelopment()) {
    return `${getViteDevServer()}/${scriptEntry}`;
  }

  const currentManifest = await loadViteManifest();
  if (!currentManifest) {
    logger.error("Vite manifest is empty. Run 'bun run build:assets' first.");
    return "";
  }

  const entry = resolveManifestEntry(currentManifest, scriptEntry);
  if (!entry?.file) {
    logger.error(`Vite manifest does not contain the ${scriptEntry} entry.`);
    return "";
  }

  return `/build/${entry.file}`;
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
