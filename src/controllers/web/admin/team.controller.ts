import type { Context } from "hono";
import * as ClientRepository from "../../../repositories/admin/client.repository.ts";
import * as UserRepository from "../../../repositories/admin/user.repository.ts";
import * as UserService from "../../../services/admin/user.service.ts";
import * as RbacRepository from "../../../repositories/admin/rbac.repository.ts";
import { getDrizzleDb } from "../../../database/drizzle.ts";
import { clientMembers } from "../../../database/schema/client/client.schema.ts";
import { getAuthUser, flashSuccess, flashError } from "../../../utils/session.util.ts";
import { ROUTES } from "../../../configs/routes.config.ts";
import { ACCOUNT_STATUSES } from "../../../database/schema/common/status.schema.ts";
import { PASSWORD_HASH_OPTIONS } from "../../../services/admin/user.service.ts";
import { eq } from "drizzle-orm";
import { z } from "zod";

const InviteMemberSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Valid email required"),
  roleId: z.number().int().positive(),
});

const resolveClientForUser = async (userId: number) => {
  const client = await ClientRepository.findClientByUserId(userId);
  if (client) return client;

  const all = await ClientRepository.findAllClients({ perPage: 1 });
  return all.rows[0] ?? null;
};

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
  const client = await resolveClientForUser(authUserId);

  let members: any[] = [];
  if (client) {
    members = await ClientRepository.findClientMembers(client.id);
  }

  const allRoles = await RbacRepository.findAllRoles();
  const clientRoles = allRoles.filter((r) => r.type === "client");

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
  const client = await resolveClientForUser(authUserId);

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

  // Find or create user
  let user = await UserRepository.findUserByEmail(parsed.data.email);
  if (!user) {
    const defaultPassword = Bun.randomUUIDv7();
    const passwordHash = await Bun.password.hash(defaultPassword, PASSWORD_HASH_OPTIONS);
    user = await UserRepository.insertUser({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      status: ACCOUNT_STATUSES.ACTIVE,
    });
  }

  // Attach to client_members
  const db = await getDrizzleDb("sqlite1");
  try {
    await db.insert(clientMembers).values({
      clientId: client.id,
      userId: user.id,
      roleId: parsed.data.roleId,
      status: ACCOUNT_STATUSES.ACTIVE,
    });
    flashSuccess(c, `Team member "${user.name}" added successfully.`);
  } catch {
    flashError(c, "User is already a member of this team.");
  }

  return c.redirect(ROUTES.WEB.ADMIN.TEAM);
};

export const removeTeamMemberFromWeb = async (c: Context) => {
  const memberId = Number.parseInt(c.req.param("id") ?? "", 10);
  if (Number.isNaN(memberId)) {
    flashError(c, "Invalid member ID.");
    return c.redirect(ROUTES.WEB.ADMIN.TEAM);
  }

  const db = await getDrizzleDb("sqlite1");
  await db.delete(clientMembers).where(eq(clientMembers.id, memberId));
  flashSuccess(c, "Member removed from team.");

  return c.redirect(ROUTES.WEB.ADMIN.TEAM);
};
