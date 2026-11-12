import type { Context } from "hono";
import * as ClientService from "../../../services/admin/client.service.ts";
import * as UserService from "../../../services/admin/user.service.ts";
import * as RbacService from "../../../services/admin/rbac.service.ts";
import { getAuthUser, flashSuccess, flashError } from "../../../utils/session.util.ts";
import { ROUTES } from "../../../configs/routes.config.ts";
import { logger } from "../../../utils/logger.util.ts";
import { z } from "zod";

const InviteMemberSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Valid email required"),
  roleId: z.number().int().positive(),
});

const getAuthUserSummary = async (c: Context) => {
  const session = c.get("webSession");
  const authUserId = getAuthUser(session);

  let authUser: { name: string; email: string } | null = null;
  if (authUserId !== null) {
    try {
      const user = await UserService.findUser(authUserId);
      authUser = { name: user.name, email: user.email };
    } catch {
      authUser = null;
    }
  }
  return { authUserId: authUserId ?? 0, authUser };
};

export const showTeamIndex = async (c: Context) => {
  const { authUserId, authUser } = await getAuthUserSummary(c);
  const client = await ClientService.resolveClientForUser(authUserId);

  let members: any[] = [];
  if (client) {
    members = await ClientService.listMembers(client.id);
  }

  const clientRoles = await RbacService.listAllRoles("client");

  return c.render("dashboard-admin/Admin/Team/Index", {
    client,
    members,
    clientRoles,
    authUserId,
    authUser,
  });
};

export const inviteTeamMemberFromWeb = async (c: Context) => {
  const { authUserId } = await getAuthUserSummary(c);
  const client = await ClientService.resolveClientForUser(authUserId);

  if (!client) {
    flashError(c, "No client organization associated with your account.");
    return c.redirect(ROUTES.WEB.ADMIN.TEAM);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = InviteMemberSchema.safeParse(body);

  if (!parsed.success) {
    flashError(c, parsed.error.issues[0]?.message || "Invalid input");
    return c.redirect(ROUTES.WEB.ADMIN.TEAM);
  }

  try {
    const { user } = await ClientService.inviteMember({
      clientId: client.id,
      name: parsed.data.name,
      email: parsed.data.email,
      roleId: parsed.data.roleId,
    });
    flashSuccess(c, `Team member "${user.name}" added successfully.`);
  } catch (err: any) {
    logger.warn("[AdminTeamWeb] Failed to add team member", {
      clientId: client.id,
      email: parsed.data.email,
      error: err?.message,
    });
    flashError(c, err?.message || "Failed to add team member.");
  }

  return c.redirect(ROUTES.WEB.ADMIN.TEAM);
};

export const removeTeamMemberFromWeb = async (c: Context) => {
  const memberId = Number.parseInt(c.req.param("id") ?? "", 10);
  if (Number.isNaN(memberId)) {
    flashError(c, "Invalid member ID.");
    return c.redirect(ROUTES.WEB.ADMIN.TEAM);
  }

  try {
    await ClientService.removeMember(memberId);
    flashSuccess(c, "Member removed from team.");
  } catch (err: any) {
    logger.warn("[AdminTeamWeb] Failed to remove team member", {
      memberId,
      error: err?.message,
    });
    flashError(c, err?.message || "Failed to remove member.");
  }

  return c.redirect(ROUTES.WEB.ADMIN.TEAM);
};
