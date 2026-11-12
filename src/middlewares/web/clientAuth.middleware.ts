import type { MiddlewareHandler } from "hono";
import { ROUTES } from "../../configs/routes.config.ts";
import {
  flashError,
  getClientAuthUser,
  getActiveClientId,
  switchSessionWorkspace,
  clearClientAuthUser,
} from "../../utils/session.util.ts";
import * as ClientUserRepository from "../../repositories/client/clientUser.repository.ts";
import * as RbacRepository from "../../repositories/admin/rbac.repository.ts";
import { logger } from "../../utils/logger.util.ts";

/**
 * Requires an authenticated client portal session (Guard 2).
 * Anonymous visitors are redirected to `/client/login` with flash error.
 * Populates `clientUser`, `currentClient`, `currentRole`, `currentPermissions`,
 * and `userWorkspaces` onto the Hono Context.
 */
export const clientAuthGuard: MiddlewareHandler = async (c, next) => {
  const session = c.get("webSession");
  const clientUserId = session ? getClientAuthUser(session) : null;

  if (!session || clientUserId === null) {
    flashError(c, "Please log in to the Client Portal first.");
    return c.redirect(ROUTES.WEB.CLIENT.LOGIN);
  }

  // 1. Fetch Client User
  const user = await ClientUserRepository.findClientUserById(clientUserId);
  if (!user || !user.isActive || user.status === "BANNED" || user.status === "INACTIVE") {
    logger.warn("[ClientAuthGuard] Access blocked: account restricted", {
      clientUserId,
      status: user?.status,
      path: c.req.path,
    });
    clearClientAuthUser(session);
    flashError(c, "Account is deactivated or suspended. Please contact support.");
    return c.redirect(ROUTES.WEB.CLIENT.LOGIN);
  }

  // 2. Fetch User Workspaces
  const workspaces = await ClientUserRepository.findUserWorkspaces(clientUserId);
  let activeClientId = getActiveClientId(session);

  let activeWorkspace = workspaces.find((w) => w.clientId === activeClientId);
  if (!activeWorkspace && workspaces.length > 0) {
    activeWorkspace = workspaces[0];
    activeClientId = activeWorkspace!.clientId;
    switchSessionWorkspace(session, activeClientId);
  }

  // 3. Resolve Permissions for Current Active Role
  let permissions: string[] = [];
  if (activeWorkspace) {
    const rolePerms = await RbacRepository.findRolePermissions(activeWorkspace.roleId);
    permissions = rolePerms.map((p) => p.code);
  }

  c.set("clientUser", {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
  });

  c.set(
    "currentClient",
    activeWorkspace
      ? {
          id: activeWorkspace.clientId,
          name: activeWorkspace.clientName,
          slug: activeWorkspace.clientSlug,
          status: activeWorkspace.clientStatus,
        }
      : null,
  );

  c.set("currentRole", activeWorkspace?.roleName ?? null);
  c.set("currentPermissions", permissions);
  c.set("userWorkspaces", workspaces);

  await next();
};

/**
 * Inverse of `clientAuthGuard`: redirects authenticated client users
 * away from the login/register pages to the portal dashboard.
 */
export const clientGuestGuard: MiddlewareHandler = async (c, next) => {
  const session = c.get("webSession");
  const clientUserId = session ? getClientAuthUser(session) : null;

  if (session && clientUserId !== null) {
    return c.redirect(ROUTES.WEB.CLIENT.DASHBOARD);
  }

  await next();
};
