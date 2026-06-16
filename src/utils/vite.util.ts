import { configApp } from "../configs/app.config.ts";
import { logger } from "./logger.util.ts";

let manifest: Record<string, { file?: string; css?: string[] }> | null = null;

export const getAsset = async (key: string) => {
  if (configApp.isDevelopment()) {
    return `http://localhost:5173/${key}`;
  }

  if (!manifest) {
    try {
      const manifestPath = "./dist/.vite/manifest.json";
      manifest = await Bun.file(manifestPath).json();
    } catch (e) {
      logger.error("Vite manifest not found. Run 'bun run build:client' first.");
      return "";
    }
  }

  return `/${manifest?.[key]?.file || ""}`;
};

export const getStyle = async (key: string) => {
  if (configApp.isDevelopment()) return "";

  if (!manifest) {
    await getAsset(key);
  }

  const cssFile = manifest?.[key]?.css?.[0];
  return cssFile ? `/${cssFile}` : "";
};
