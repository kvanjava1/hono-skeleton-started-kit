import { and, eq, isNull, sql } from "drizzle-orm";
import { getDrizzleDb } from "../../database/drizzle.ts";
import {
  clientUsers,
  type ClientUser,
  type NewClientUser,
} from "../../database/schema/client/clientUser.schema.ts";
import { clients, clientMembers } from "../../database/schema/client/client.schema.ts";
import { roles } from "../../database/schema/admin/rbac.schema.ts";

export type { ClientUser, NewClientUser };

export interface ClientMembershipItem {
  clientId: number;
  clientName: string;
  clientSlug: string;
  clientStatus: string;
  roleId: number;
  roleName: string;
  memberStatus: string;
}

export const findClientUserById = async (id: number): Promise<ClientUser | null> => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db
    .select()
    .from(clientUsers)
    .where(and(eq(clientUsers.id, id), isNull(clientUsers.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
};

export const findClientUserByEmail = async (email: string): Promise<ClientUser | null> => {
  const db = await getDrizzleDb("sqlite1");
  const normalized = email.trim().toLowerCase();
  const rows = await db
    .select()
    .from(clientUsers)
    .where(and(eq(clientUsers.email, normalized), isNull(clientUsers.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
};

export const createClientUser = async (data: {
  name: string;
  email: string;
  passwordHash: string;
  lastActiveClientId?: number;
}): Promise<ClientUser> => {
  const db = await getDrizzleDb("sqlite1");
  const [created] = await db
    .insert(clientUsers)
    .values({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      passwordHash: data.passwordHash,
      status: "ACTIVE",
      isActive: true,
      lastActiveClientId: data.lastActiveClientId ?? null,
    })
    .returning();
  return created!;
};

export const updateLastActiveClient = async (
  userId: number,
  clientId: number,
): Promise<void> => {
  const db = await getDrizzleDb("sqlite1");
  await db
    .update(clientUsers)
    .set({ lastActiveClientId: clientId })
    .where(eq(clientUsers.id, userId));
};

export const updateClientUserStatus = async (
  userId: number,
  patch: Partial<ClientUser>,
): Promise<void> => {
  const db = await getDrizzleDb("sqlite1");
  await db.update(clientUsers).set(patch).where(eq(clientUsers.id, userId));
};

export const updateClientUser = async (
  userId: number,
  patch: Partial<NewClientUser>,
): Promise<ClientUser | null> => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db
    .update(clientUsers)
    .set({ ...patch, updatedAt: sql`datetime('now')` })
    .where(eq(clientUsers.id, userId))
    .returning();
  return rows[0] ?? null;
};

/**
 * Returns all active organization memberships for a client user.
 */
export const findUserWorkspaces = async (
  clientUserId: number,
): Promise<ClientMembershipItem[]> => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db
    .select({
      clientId: clients.id,
      clientName: clients.name,
      clientSlug: clients.slug,
      clientStatus: clients.status,
      roleId: roles.id,
      roleName: roles.name,
      memberStatus: clientMembers.status,
    })
    .from(clientMembers)
    .innerJoin(clients, eq(clientMembers.clientId, clients.id))
    .innerJoin(roles, eq(clientMembers.roleId, roles.id))
    .where(
      and(
        eq(clientMembers.userId, clientUserId),
        eq(clientMembers.status, "ACTIVE"),
        isNull(clients.deletedAt),
      ),
    );
  return rows;
};
