import { configApp } from "../configs/app.config.ts";

/**
 * Vite Asset Resolver Utility
 * Membantu Hono JSX menemukan file JS/CSS hasil build Vite (dengan hash)
 */

let manifest: any = null;

/**
 * Mendapatkan path file JS/Asset dari manifest atau port dev Vite
 */
export const getAsset = async (key: string) => {
  if (configApp.isDevelopment) {
    // Mode Development: Arahkan ke Vite Dev Server
    return `http://localhost:5173/${key}`;
  }

  // Mode Production: Baca dari manifest.json
  if (!manifest) {
    try {
      const manifestPath = "./dist/.vite/manifest.json";
      manifest = await Bun.file(manifestPath).json();
    } catch (e) {
      console.error("❌ Vite manifest not found. Run 'bun run build:client' first.");
      return "";
    }
  }

  return `/${manifest[key]?.file || ""}`;
};

/**
 * Mendapatkan path file CSS dari manifest
 */
export const getStyle = async (key: string) => {
  // Vite menyuntikkan CSS secara dinamis di mode dev, jadi kita tidak butuh link tag
  if (configApp.isDevelopment) return ""; 
  
  if (!manifest) {
    // Pastikan manifest terisi (lewat getAsset biasanya sudah terisi)
    await getAsset(key);
  }

  const cssFile = manifest?.[key]?.css?.[0];
  return cssFile ? `/${cssFile}` : "";
};
