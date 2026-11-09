/**
 * Cookie-backed web session (Laravel `SESSION_DRIVER=cookie` parity).
 *
 * The session state (CSRF token + flash bag) is serialized to a single
 * httpOnly cookie signed with HMAC (`setSignedCookie`) — no server-side
 * store and no new dependency, so it keeps working when Redis is disabled.
 * A second, non-httpOnly `XSRF-TOKEN` cookie mirrors the CSRF token so the
 * Inertia client sends it back automatically as `X-XSRF-TOKEN` (verified in
 * @inertiajs/core 3.11 `XhrHttpClient`).
 *
 * Secrets come from `configSession` only — never `process.env` directly.
 */
import type { Context } from "hono";
import {
  getCookie,
  getSignedCookie,
  setCookie,
  setSignedCookie,
} from "hono/cookie";
import { configSession } from "../configs/session.config.ts";
import { configApp } from "../configs/app.config.ts";

export interface WebSessionFlash {
  success?: string;
  error?: string;
  /** Field error bag for the redirect-back validation flow (Laravel parity). */
  errors?: Record<string, string>;
}

export interface WebSession {
  csrfToken: string;
  flash: WebSessionFlash;
}

const createState = (): WebSession => ({
  csrfToken: crypto.randomUUID(),
  flash: {},
});

/** Cookie options shared by both cookies (XSRF is later downgraded to non-httpOnly). */
const cookieOptions = () => ({
  path: "/",
  httpOnly: true,
  secure: configApp.isProduction(),
  sameSite: "Lax" as const,
  maxAge: configSession.ttlMinutes * 60,
});

const xsrfCookieOptions = () => ({
  ...cookieOptions(),
  httpOnly: false,
});

/**
 * Loads the session state from the signed cookie, or creates a fresh one.
 * Does NOT touch cookies — persistence happens once per request in
 * `persistWebSession` (after the handler, so flash written by controllers
 * is included).
 */
export const loadWebSession = async (c: Context): Promise<WebSession> => {
  const raw = await getSignedCookie(c, configSession.secret, configSession.cookieName);
  if (!raw) return createState();

  try {
    const parsed = JSON.parse(raw) as Partial<WebSession>;
    if (!parsed.csrfToken) return createState();
    return {
      csrfToken: parsed.csrfToken,
      flash: parsed.flash ?? {},
    };
  } catch {
    // Tampered/unparseable payload — a valid signature means it was written
    // by us, so this is effectively unreachable; fall back to a new session.
    return createState();
  }
};

/**
 * Writes both cookies for the current session state. Called once per web
 * request (after the handler) by the session middleware.
 */
export const persistWebSession = async (
  c: Context,
  session: WebSession,
): Promise<void> => {
  await setSignedCookie(
    c,
    configSession.cookieName,
    JSON.stringify(session),
    configSession.secret,
    cookieOptions(),
  );
  setCookie(c, configSession.xsrfCookieName, session.csrfToken, xsrfCookieOptions());
};

/** Reads the raw XSRF cookie value (used by the CSRF guard comparison). */
export const readXsrfCookie = (c: Context): string | undefined =>
  getCookie(c, configSession.xsrfCookieName);

/**
 * Stores a flash value on the current request's session state. Persisted
 * when the session middleware finalizes the response; consumed once on the
 * next render via `consumeWebFlash`.
 */
export const setWebFlash = (
  session: WebSession,
  key: keyof WebSessionFlash,
  value: string | Record<string, string>,
): void => {
  session.flash[key] = value as never;
};

/**
 * Returns the flash bag and clears it on the session state (consume-once,
 * Laravel `session()->flash()` parity). Called while rendering (shared
 * props); the cleared state is persisted by the session middleware.
 */
export const consumeWebFlash = (session: WebSession): WebSessionFlash => {
  const flash = session.flash;
  session.flash = {};
  return flash;
};

/** Convenience wrappers for the common single-message flash keys. */
export const flashSuccess = (c: Context, message: string): void => {
  const session = c.get("webSession");
  if (session) setWebFlash(session, "success", message);
};

export const flashError = (c: Context, message: string): void => {
  const session = c.get("webSession");
  if (session) setWebFlash(session, "error", message);
};
