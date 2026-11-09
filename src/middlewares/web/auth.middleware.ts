import type { MiddlewareHandler } from "hono";
import { ROUTES } from "../../configs/routes.config.ts";
import { flashError, getAuthUser } from "../../utils/session.util.ts";

/**
 * Requires an authenticated admin session (plan D3). Anonymous visitors get
 * a flash message + redirect to the login page; works for both plain
 * browser navigations and Inertia XHR visits (a 303 redirect is part of the
 * Inertia protocol).
 *
 * Requires `webSessionMiddleware` to have run first (wired at the web
 * router level).
 */
export const authGuard: MiddlewareHandler = async (c, next) => {
  const session = c.get("webSession");
  if (!session || getAuthUser(session) === null) {
    flashError(c, "Silakan login terlebih dahulu");
    return c.redirect(ROUTES.WEB.ADMIN.LOGIN);
  }
  await next();
};

/**
 * Inverse of `authGuard` for the login page: an already-authenticated user
 * has no business on /admin/login and is sent to the admin home instead.
 */
export const guestGuard: MiddlewareHandler = async (c, next) => {
  const session = c.get("webSession");
  if (session && getAuthUser(session) !== null) {
    return c.redirect(ROUTES.WEB.ADMIN.USERS);
  }
  await next();
};
