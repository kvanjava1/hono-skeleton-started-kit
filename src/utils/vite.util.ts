import { configApp } from "../configs/app.config.ts";
import { logger } from "./logger.util.ts";

const cssEntry = "css/app.css";
const viteDevServer = "http://localhost:5173";

type ManifestEntry = {
  file?: string;
  css?: string[];
  src?: string;
};

let manifest: Record<string, ManifestEntry> | null = null;

export const getStyle = async (): Promise<string> => {
  if (configApp.isDevelopment()) {
    return `${viteDevServer}/${cssEntry}`;
  }

  let currentManifest = manifest;
  if (!currentManifest) {
    try {
      currentManifest = await Bun.file("./dist/.vite/manifest.json").json();
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

  return `/${stylesheet}`;
};
