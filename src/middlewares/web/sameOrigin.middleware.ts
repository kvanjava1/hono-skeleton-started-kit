import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "../../utils/logger.util.ts";

const SAFE_METHOD_RE = /^(GET|HEAD|OPTIONS)$/;

/**
 * Same-origin guard for unsafe web methods (POST/PUT/PATCH/DELETE).
 *
 * Why not the built-in `hono/csrf` alone: it only guards classic form
 * content-types (urlencoded/multipart), while Inertia submits JSON bodies.
 * This guard applies the origin check to every unsafe method:
 * - Origin/Referer present and mismatched with the request host -> 403.
 * - No Origin/Referer (non-browser client) -> allowed for now and logged;
 *   strict enforcement (session-bound CSRF token) lands in Phase 2.
 *
 * Inertia's axios client always sends `Origin` on POST requests, so real
 * navigations pass while cross-site forgeries are rejected.
 */
export const sameOriginGuard: MiddlewareHandler = async (c, next) => {
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
    logger.warn("[SameOriginGuard] Cross-origin request rejected", {
      method: c.req.method,
      path: c.req.path,
      clientOrigin,
    });
    throw new HTTPException(403, { message: "Cross-origin request rejected" });
  }

  if (!clientOrigin) {
    logger.debug("[SameOriginGuard] Unsafe request without Origin/Referer", {
      method: c.req.method,
      path: c.req.path,
    });
  }

  await next();
};
