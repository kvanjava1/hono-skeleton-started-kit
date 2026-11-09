import type { MiddlewareHandler } from "hono";
import { logger } from "../../utils/logger.util.ts";
import { ForbiddenError } from "../../utils/errors.util.ts";

const SAFE_METHOD_RE = /^(GET|HEAD|OPTIONS)$/;

/**
 * CSRF guard for unsafe web methods (POST/PUT/PATCH/DELETE) — two layers:
 *
 * 1. Origin/Referer must match the request host when present. (The built-in
 *    `hono/csrf` alone is not enough: it only guards classic form
 *    content-types, while Inertia submits JSON bodies.)
 * 2. Session-bound token: the Inertia client (`XhrHttpClient` in
 *    @inertiajs/core 3.11) reads the `XSRF-TOKEN` cookie and sends it back
 *    automatically as the `X-XSRF-TOKEN` header on same-origin mutations.
 *    The header must equal `webSession.csrfToken` — a token tied to the
 *    server-side session state, which plain cookie injection cannot forge.
 *
 * Requires `webSessionMiddleware` to have run first (wired at the web
 * router level).
 */
export const csrfGuard: MiddlewareHandler = async (c, next) => {
  if (SAFE_METHOD_RE.test(c.req.method)) return next();

  const requestOrigin = new URL(c.req.url).origin;
  const originHeader = c.req.header("origin");
  const refererHeader = c.req.header("referer");

  let clientOrigin: string | undefined = originHeader;
  if (!clientOrigin && refererHeader) {
    try {
      clientOrigin = new URL(refererHeader).origin;
    } catch {
      clientOrigin = undefined;
    }
  }

  if (clientOrigin && clientOrigin !== requestOrigin) {
    logger.warn("[CsrfGuard] Cross-origin request rejected", {
      method: c.req.method,
      path: c.req.path,
      clientOrigin,
    });
    throw new ForbiddenError("Cross-origin request rejected");
  }

  const session = c.get("webSession");
  const headerToken = c.req.header("x-xsrf-token");
  if (!session || !headerToken || headerToken !== session.csrfToken) {
    logger.warn("[CsrfGuard] CSRF token missing or invalid", {
      method: c.req.method,
      path: c.req.path,
      hasToken: Boolean(headerToken),
    });
    throw new ForbiddenError("CSRF token missing or invalid");
  }

  await next();
};
