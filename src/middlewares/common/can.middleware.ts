import type { Context, Next } from "hono";
import { ForbiddenError, UnauthorizedError } from "../../utils/errors.util.ts";
import { getAuthUser } from "../../utils/session.util.ts";
import * as RbacService from "../../services/admin/rbac.service.ts";

/**
 * Universal Authorization Middleware:
 * Enforces that the caller (web user session or API client token) has the required permission.
 *
 * Usage:
 *   router.post("/admin/clients", can("clients.create"), handler);
 */
export const can = (requiredPermission: string) => {
  return async (c: Context, next: Next) => {
    // 1. Direct permissions set on Context (e.g. from apiClientGuard for API token requests)
    const contextPermissions: string[] | undefined = c.get("currentPermissions");
    if (contextPermissions) {
      if (
        contextPermissions.includes("*") ||
        contextPermissions.includes(requiredPermission)
      ) {
        return await next();
      }
      throw new ForbiddenError(
        `You do not have permission to perform '${requiredPermission}'`,
      );
    }

    // 2. Web session authentication check
    const session = c.get("webSession");
    const authUserId = session ? getAuthUser(session) : null;

    if (!authUserId) {
      throw new UnauthorizedError("Authentication required.");
    }

    const hasAccess = await RbacService.hasPermission(authUserId, requiredPermission);
    if (!hasAccess) {
      throw new ForbiddenError(
        `You do not have permission to perform '${requiredPermission}'`,
      );
    }

    return await next();
  };
};
