import { and, eq, inArray } from "drizzle-orm";
import { getDrizzleDb } from "../../database/drizzle.ts";
import {
  roles,
  permissions,
  rolePermissions,
  userRoles,
  type Role,
  type Permission,
} from "../../database/schema/admin/rbac.schema.ts";
import { clientMembers } from "../../database/schema/client/client.schema.ts";

/**
 * Retrieves all distinct permission codes assigned to a user via:
 * 1. Backoffice user_roles -> role_permissions -> permissions
 * 2. Client portal client_members -> role_permissions -> permissions
 */
export const findUserPermissions = async (userId: number): Promise<string[]> => {
  const db = await getDrizzleDb("sqlite1");

  // 1. Get role IDs from user_roles (Admin)
  const userRoleRows = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  // 2. Get role IDs from client_members (Client organization)
  const clientMemberRows = await db
    .select({ roleId: clientMembers.roleId })
    .from(clientMembers)
    .where(eq(clientMembers.userId, userId));

  const roleIds = Array.from(
    new Set([
      ...userRoleRows.map((r) => r.roleId),
      ...clientMemberRows.map((r) => r.roleId),
    ]),
  );

  if (roleIds.length === 0) {
    return [];
  }

  // 3. Get permission IDs for these roles
  const rolePermRows = await db
    .select({ permissionId: rolePermissions.permissionId })
    .from(rolePermissions)
    .where(inArray(rolePermissions.roleId, roleIds));

  const permIds = Array.from(new Set(rolePermRows.map((rp) => rp.permissionId)));
  if (permIds.length === 0) {
    return [];
  }

  // 4. Resolve permission codes
  const permRows = await db
    .select({ code: permissions.code })
    .from(permissions)
    .where(inArray(permissions.id, permIds));

  return permRows.map((p) => p.code);
};

/**
 * Retrieves all roles assigned to a user.
 */
export const findUserRoles = async (userId: number): Promise<Role[]> => {
  const db = await getDrizzleDb("sqlite1");

  const userRoleRows = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  const clientMemberRows = await db
    .select({ roleId: clientMembers.roleId })
    .from(clientMembers)
    .where(eq(clientMembers.userId, userId));

  const roleIds = Array.from(
    new Set([
      ...userRoleRows.map((r) => r.roleId),
      ...clientMemberRows.map((r) => r.roleId),
    ]),
  );

  if (roleIds.length === 0) {
    return [];
  }

  return db.select().from(roles).where(inArray(roles.id, roleIds));
};

export const findAllRoles = async (): Promise<Role[]> => {
  const db = await getDrizzleDb("sqlite1");
  return db.select().from(roles);
};

export const findAllPermissions = async (): Promise<Permission[]> => {
  const db = await getDrizzleDb("sqlite1");
  return db.select().from(permissions);
};

export const assignRoleToUser = async (
  userId: number,
  roleId: number,
): Promise<void> => {
  const db = await getDrizzleDb("sqlite1");
  try {
    await db.insert(userRoles).values({ userId, roleId }).onConflictDoNothing();
  } catch {
    // Ignore duplicate assignment
  }
};

export const removeRoleFromUser = async (
  userId: number,
  roleId: number,
): Promise<void> => {
  const db = await getDrizzleDb("sqlite1");
  await db
    .delete(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
};
