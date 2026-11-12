import type { Context } from "hono";
import * as ClientAuthService from "../../../services/client/clientAuth.service.ts";
import { flashError, flashSuccess, switchSessionWorkspace } from "../../../utils/session.util.ts";
import { ROUTES } from "../../../configs/routes.config.ts";
import { logger } from "../../../utils/logger.util.ts";
import { recordActivity } from "../../../services/common/activityLog.service.ts";

/**
 * POST /client/workspaces/switch/:id
 * Switches the active organization for the current authenticated client user.
 */
export const switchWorkspaceAction = async (c: Context) => {
  const targetIdRaw = Number(c.req.param("id"));
  if (isNaN(targetIdRaw) || targetIdRaw <= 0) {
    flashError(c, "Invalid organization identifier.");
    return c.redirect(ROUTES.WEB.CLIENT.DASHBOARD);
  }

  const clientUser = c.get("clientUser") as { id: number; name: string } | undefined;
  if (!clientUser) {
    return c.redirect(ROUTES.WEB.CLIENT.LOGIN);
  }

  try {
    const target = await ClientAuthService.switchWorkspace(clientUser.id, targetIdRaw);
    const session = c.get("webSession");
    if (session) {
      switchSessionWorkspace(session, target.clientId);
    }

    logger.info("[ClientWeb] Workspace switched", {
      clientUserId: clientUser.id,
      targetClientId: target.clientId,
      clientName: target.clientName,
    });
    flashSuccess(c, `Switched workspace to ${target.clientName}`);

    recordActivity({
      clientId: target.clientId,
      actorId: clientUser.id,
      actorType: "client_user",
      actorName: clientUser.name,
      action: "workspace.switch",
      scope: "personal",
      description: `Switched active organization to "${target.clientName}"`,
      ipAddress: c.req.header("x-forwarded-for") || "unknown",
      userAgent: c.req.header("user-agent"),
      metadata: { targetClientId: target.clientId, targetClientName: target.clientName },
    });
  } catch (err: any) {
    logger.warn("[ClientWeb] Workspace switch failed", {
      clientUserId: clientUser.id,
      targetClientId: targetIdRaw,
      error: err?.message,
    });
    flashError(c, err?.message || "Failed to switch organization.");
  }

  const referer = c.req.header("referer");
  if (referer) {
    try {
      const url = new URL(referer);
      return c.redirect(url.pathname + url.search, 303);
    } catch {
      // fallback
    }
  }

  return c.redirect(ROUTES.WEB.CLIENT.DASHBOARD, 303);
};
