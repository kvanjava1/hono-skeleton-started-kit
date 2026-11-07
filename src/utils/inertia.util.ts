/**
 * Inertia.js integration utilities.
 *
 * Bridges the Inertia protocol (via the official `@hono/inertia` middleware)
 * with this skeleton's conventions:
 * - Asset version sourced from the Vite manifest hash (OQ-2 decision).
 * - Shared props for every Inertia page (appName, isDev).
 * - Zod error mapping to the Inertia error bag contract (422 JSON).
 */
import type { Context } from "hono";
import type { ZodError } from "zod";
import { readFileSync } from "node:fs";
import { configApp } from "../configs/app.config.ts";
import { logger } from "./logger.util.ts";
import { ValidationError } from "./errors.util.ts";

export const APP_NAME = "Hono Skeleton Multi-DB";

let cachedAssetVersion: string | null = null;

/**
 * Deterministic asset version for the Inertia protocol.
 * Development: constant string (HMR handles freshness).
 * Production: SHA-256 of the Vite manifest content — changes on every build.
 * Returns null when the manifest is unavailable (version checking disabled).
 * Synchronous on purpose: evaluated once at middleware mount (startup).
 */
export const getAssetVersion = (): string | null => {
  if (configApp.isDevelopment()) return "dev";
  if (cachedAssetVersion) return cachedAssetVersion;

  const manifestPaths = [
    "./public/build/.vite/manifest.json",
    "./public/build/manifest.json",
  ];
  for (const manifestPath of manifestPaths) {
    try {
      const raw = readFileSync(manifestPath, "utf8");
      cachedAssetVersion = new Bun.CryptoHasher("sha256")
        .update(raw)
        .digest("hex");
      return cachedAssetVersion;
    } catch {
      // Try the next manifest path.
    }
  }

  logger.error(
    "[InertiaUtil] Vite manifest not found; asset version disabled. Run 'bun run build:assets' first.",
  );
  return null;
};

/**
 * Shared props injected into every Inertia page (mirrors Laravel's
 * HandleInertiaRequests::share()). Page-specific props override these keys.
 */
export const getSharedProps = () => ({
  appName: APP_NAME,
  isDev: configApp.isDevelopment(),
});

/**
 * Maps a ZodError into the Inertia error bag shape: { fieldName: message }.
 * Nested paths are joined with dots (e.g. "address.city").
 */
export const toInertiaErrorBag = (error: ZodError): Record<string, string> => {
  const bag: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_root";
    if (!bag[key]) bag[key] = issue.message;
  }
  return bag;
};

/**
 * Produces the Inertia validation error response (422 + { errors }) for
 * requests marked with the X-Inertia header. Returns null when the request
 * is not an Inertia request or the error carries no field errors — in that
 * case the caller falls back to the standard error contract.
 */
export const inertiaErrorResponse = (
  c: Context,
  error: unknown,
): Response | null => {
  if (!c.req.header("X-Inertia")) return null;
  if (!(error instanceof ValidationError)) return null;

  const errors = error.data;
  if (!errors || typeof errors !== "object") return null;

  return c.json({ errors }, 422);
};

/**
 * Origin page description a web controller provides when re-rendering its
 * own page after a failed form submission. `url` is the URL of the page the
 * user is on — not the form action — so the client keeps the address bar.
 */
export interface InertiaOriginPage {
  component: string;
  url: string;
  props: Record<string, unknown>;
}

/**
 * Renders a failed form submission as a VALID Inertia response (422):
 * `X-Inertia` response header + page envelope whose props carry `errors`.
 * Client `@inertiajs/core` 3.x replaces page props wholesale and reads
 * `page.props.errors` after `setPage()`; a plain `{ errors }` JSON is
 * rejected with the "plain JSON response" modal and the error bag never fills.
 */
export const inertiaValidationErrorResponse = (
  c: Context,
  origin: InertiaOriginPage,
  errors: Record<string, string>,
): Response => {
  c.header("Vary", "Accept, X-Inertia");
  c.header("X-Inertia", "true");
  return c.json(
    {
      component: origin.component,
      props: { ...getSharedProps(), ...origin.props, errors },
      url: origin.url,
      version: getAssetVersion(),
    },
    422,
  );
};
