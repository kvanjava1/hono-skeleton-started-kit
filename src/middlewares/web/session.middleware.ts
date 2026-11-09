import type { MiddlewareHandler } from "hono";
import { ROUTES } from "../../configs/routes.config.ts";
import {
  loadWebSession,
  persistWebSession,
  type WebSession,
} from "../../utils/session.util.ts";

declare module "hono" {
  interface ContextVariableMap {
    webSession: WebSession;
  }
}

/**
 * Web session middleware (Laravel `SESSION_DRIVER=cookie` parity).
 *
 * Runs before web route handlers: loads (or creates) the signed-cookie
 * session and exposes it as `c.get("webSession")`. Cookies are persisted
 * AFTER the handler so flash values written by controllers on redirect
 * responses are included.
 *
 * Scoped to the web layer only — API paths pass through untouched so the
 * JSON API contract stays cookie-free.
 */
export const webSessionMiddleware: MiddlewareHandler = async (c, next) => {
  if (c.req.path.startsWith(ROUTES.API.BASE_PATH)) return next();

  const session = await loadWebSession(c);
  c.set("webSession", session);

  await next();

  await persistWebSession(c, session);
};
