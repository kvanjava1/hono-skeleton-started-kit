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
import { ROUTES } from "../configs/routes.config.ts";
import { logger } from "./logger.util.ts";
import { ValidationError } from "./errors.util.ts";
import { consumeWebFlash, setWebFlash } from "./session.util.ts";

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
 *
 * With a Context, the per-request session flash is consumed exactly once
 * and exposed as `flash` (+ Laravel-style `errors` for the redirect-back
 * validation flow). Without a Context (e.g. building envelopes manually)
 * only the static props are returned.
 */
export const getSharedProps = (c?: Context) => {
  const base = {
    appName: APP_NAME,
    isDev: configApp.isDevelopment(),
  };
  if (!c) return base;

  const session = c.get("webSession");
  const flash = session ? consumeWebFlash(session) : {};
  const permissions: string[] = c.get("currentPermissions") ?? [];
  const isManagement: boolean = c.get("isManagement") ?? true;
  const currentClient = c.get("currentClient") ?? null;

  return {
    ...base,
    flash,
    errors: flash.errors ?? {},
    auth: {
      permissions,
      isManagement,
      client: currentClient,
    },
  };
};

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
 * Fallback for ValidationErrors thrown OUTSIDE the web controllers (e.g.
 * from services) on Inertia requests. Controller-level validation renders
 * the 422 envelope itself (see inertiaValidationErrorResponse); this path
 * instead redirects back (303) with the error bag flashed to the session,
 * where getSharedProps() exposes it as the `errors` prop — replacing the
 * plain 422 JSON that the Inertia client rejected with its error modal.
 * Returns null when the request is not an Inertia request or the error
 * carries no field errors — the caller then uses the standard contract.
 */
export const inertiaErrorResponse = (
  c: Context,
  error: unknown,
): Response | null => {
  if (!c.req.header("X-Inertia")) return null;
  if (!(error instanceof ValidationError)) return null;

  const errors = error.data;
  if (!errors || typeof errors !== "object") return null;

  const session = c.get("webSession");
  if (!session) return c.json({ errors }, 422);

  setWebFlash(session, "errors", errors as Record<string, string>);
  let back = ROUTES.WEB.ROOT;
  const referer = c.req.header("referer");
  if (referer) {
    try {
      const url = new URL(referer);
      back = url.pathname + url.search;
    } catch {
      // Keep the root fallback for a malformed referer.
    }
  }
  return c.redirect(back, 303);
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
