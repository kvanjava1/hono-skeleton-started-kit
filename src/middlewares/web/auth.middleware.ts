import type { MiddlewareHandler } from "hono";
import { ROUTES } from "../../configs/routes.config.ts";
import { flashError, getAuthUser } from "../../utils/session.util.ts";
import * as RbacService from "../../services/admin/rbac.service.ts";
import * as ClientRepository from "../../repositories/admin/client.repository.ts";

/**
 * Requires an authenticated admin session (plan D3). Anonymous visitors get
 * a flash message + redirect to the login page; works for both plain
 * browser navigations and Inertia XHR visits (a 303 redirect is part of the
 * Inertia protocol).
 *
 * Pre-populates `currentPermissions`, `isManagement`, and `currentClient` on Context
 * so subsequent `can()` middleware and Inertia shared props have instantaneous access.
 */
export const authGuard: MiddlewareHandler = async (c, next) => {
  const session = c.get("webSession");
  const authUserId = session ? getAuthUser(session) : null;
  if (!session || authUserId === null) {
    flashError(c, "Please log in first");
    return c.redirect(ROUTES.WEB.ADMIN.LOGIN);
  }

  // Pre-load user permissions and role classification for fast context lookup
  try {
    const permissions = await RbacService.getUserPermissions(authUserId);
    c.set("currentPermissions", permissions);

    const roles = await RbacService.getUserRoles(authUserId);
    const isManagement = roles.some((r) => r.type === "admin") || permissions.includes("*");
    c.set("isManagement", isManagement);

    const client = await ClientRepository.findClientByUserId(authUserId);
    c.set(
      "currentClient",
      client ? { id: client.id, name: client.name, slug: client.slug } : null,
    );
  } catch {
    c.set("currentPermissions", []);
    c.set("isManagement", false);
    c.set("currentClient", null);
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
    return c.redirect(ROUTES.WEB.ADMIN.DASHBOARD);
  }
  await next();
};
