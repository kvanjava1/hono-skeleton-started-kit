import type { Context } from "hono";
import * as TeamService from "../../../services/client/team.service.ts";
import * as ClientService from "../../../services/admin/client.service.ts";
import { flashSuccess, flashError } from "../../../utils/session.util.ts";
import { ROUTES } from "../../../configs/routes.config.ts";
import { logger } from "../../../utils/logger.util.ts";
import { recordActivity } from "../../../services/common/activityLog.service.ts";
import { z } from "zod";

const InviteMemberSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().trim().toLowerCase().email("Valid email required"),
  roleId: z.number().int().positive("Please select a role"),
});

export const showClientTeamIndex = async (c: Context) => {
  const currentClient = c.get("currentClient");
  const clientUser = c.get("clientUser");
  const currentRole = c.get("currentRole");
  const userWorkspaces = c.get("userWorkspaces") ?? [];

  if (!currentClient) {
    flashError(c, "No active workspace selected.");
    return c.redirect(ROUTES.WEB.CLIENT.DASHBOARD);
  }

  let members: any[] = [];
  try {
    members = await TeamService.listWorkspaceMembers(currentClient.id);
  } catch {
    members = [];
  }

  const clientRoles = await TeamService.listClientRoles();

  return c.render("dashboard-client/Client/Team/Index", {
    client: currentClient,
    members,
    clientRoles,
    authUser: clientUser,
    role: currentRole,
    workspaces: userWorkspaces,
  });
};

export const inviteClientTeamMember = async (c: Context) => {
  const currentClient = c.get("currentClient");
  const clientUser = c.get("clientUser");
  const permissions: string[] = c.get("currentPermissions") ?? [];

  if (!currentClient || !clientUser) {
    flashError(c, "Authentication required.");
    return c.redirect(ROUTES.WEB.CLIENT.LOGIN);
  }

  const hasPerm = permissions.includes("*") || permissions.includes("team.invite");
  if (!hasPerm) {
    logger.warn("[ClientTeamWeb] Invite member rejected: missing permission", {
      clientUserId: clientUser.id,
      clientId: currentClient.id,
    });
    flashError(c, "You do not have permission to invite team members.");
    return c.redirect(ROUTES.WEB.CLIENT.TEAM);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = InviteMemberSchema.safeParse(body);

  if (!parsed.success) {
    flashError(c, parsed.error.issues[0]?.message || "Invalid input");
    return c.redirect(ROUTES.WEB.CLIENT.TEAM);
  }

  try {
    const { user } = await TeamService.inviteMemberToWorkspace({
      clientId: currentClient.id,
      name: parsed.data.name,
      email: parsed.data.email,
      roleId: parsed.data.roleId,
    });

    logger.info("[ClientTeamWeb] Member invited", {
      clientId: currentClient.id,
      email: parsed.data.email,
      invitedBy: clientUser.id,
    });

    recordActivity({
      clientId: currentClient.id,
      actorId: clientUser.id,
      actorType: "client_user",
      actorName: clientUser.name,
      action: "member.invite",
      scope: "organization",
      description: `Invited "${user.name}" (${user.email}) to the team`,
      ipAddress: c.req.header("x-forwarded-for") || "unknown",
      userAgent: c.req.header("user-agent"),
      metadata: { memberUserId: user.id, email: user.email },
    });

    flashSuccess(c, `Team member "${user.name}" invited successfully.`);
  } catch (err: any) {
    logger.warn("[ClientTeamWeb] Invite member failed", {
      clientId: currentClient.id,
      email: parsed.data.email,
      error: err?.message,
    });
    flashError(c, err?.message || "Failed to add team member.");
  }

  return c.redirect(ROUTES.WEB.CLIENT.TEAM);
};

export const removeClientTeamMember = async (c: Context) => {
  const currentClient = c.get("currentClient");
  const clientUser = c.get("clientUser");
  const permissions: string[] = c.get("currentPermissions") ?? [];
  const memberId = Number.parseInt(c.req.param("id") ?? "", 10);

  if (!currentClient || !clientUser || Number.isNaN(memberId)) {
    flashError(c, "Invalid request.");
    return c.redirect(ROUTES.WEB.CLIENT.TEAM);
  }

  const hasPerm = permissions.includes("*") || permissions.includes("team.remove");
  if (!hasPerm) {
    logger.warn("[ClientTeamWeb] Remove member rejected: missing permission", {
      clientUserId: clientUser.id,
      clientId: currentClient.id,
      memberId,
    });
    flashError(c, "You do not have permission to remove team members.");
    return c.redirect(ROUTES.WEB.CLIENT.TEAM);
  }

  try {
    const member = await ClientService.findMember(memberId);
    if (member.clientId !== currentClient.id) {
      flashError(c, "Team member not found in this organization.");
      return c.redirect(ROUTES.WEB.CLIENT.TEAM);
    }

    if (member.userId === clientUser.id) {
      flashError(c, "You cannot remove yourself from the organization.");
      return c.redirect(ROUTES.WEB.CLIENT.TEAM);
    }

    await ClientService.removeMember(memberId);
    logger.info("[ClientTeamWeb] Member removed", {
      clientId: currentClient.id,
      memberId,
      removedBy: clientUser.id,
    });

    recordActivity({
      clientId: currentClient.id,
      actorId: clientUser.id,
      actorType: "client_user",
      actorName: clientUser.name,
      action: "member.remove",
      scope: "organization",
      description: `Removed member #${memberId} (${member.name}) from the team`,
      ipAddress: c.req.header("x-forwarded-for") || "unknown",
      userAgent: c.req.header("user-agent"),
      metadata: { memberId, memberUserId: member.userId, memberName: member.name },
    });

    flashSuccess(c, "Team member removed successfully.");
  } catch (err: any) {
    logger.warn("[ClientTeamWeb] Remove member failed", {
      clientId: currentClient.id,
      memberId,
      error: err?.message,
    });
    flashError(c, err?.message || "Failed to remove team member.");
  }

  return c.redirect(ROUTES.WEB.CLIENT.TEAM);
};
