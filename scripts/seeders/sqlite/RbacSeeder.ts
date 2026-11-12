import { eq } from "drizzle-orm";
import { getDrizzleDb } from "../../../src/database/drizzle.ts";
import {
  roles,
  permissions,
  rolePermissions,
  userRoles,
} from "../../../src/database/schema/admin/rbac.schema.ts";
import { users } from "../../../src/database/schema/admin/user.schema.ts";
import { logger } from "../../../src/utils/logger.util.ts";

export const seed = async (): Promise<void> => {
  logger.info("[RbacSeeder] Running SQLite seeder: RbacSeeder");
  const db = await getDrizzleDb("sqlite1");

  // 1. Seed Permissions (Scoped by type: 'admin' vs 'client')
  const permissionsData = [
    // Admin management permissions
    { code: "admin.access", type: "admin", group: "admin", description: "Access backoffice admin panel" },
    { code: "users.view", type: "admin", group: "users", description: "View backoffice users" },
    { code: "users.create", type: "admin", group: "users", description: "Create backoffice users" },
    { code: "users.update", type: "admin", group: "users", description: "Update backoffice users" },
    { code: "users.delete", type: "admin", group: "users", description: "Delete backoffice users" },
    { code: "clients.view", type: "admin", group: "clients", description: "View API clients / organizations" },
    { code: "clients.create", type: "admin", group: "clients", description: "Create API clients" },
    { code: "clients.update", type: "admin", group: "clients", description: "Update client status and details" },
    { code: "clients.delete", type: "admin", group: "clients", description: "Delete API clients" },
    { code: "roles.view", type: "admin", group: "roles", description: "View roles and permissions" },
    { code: "roles.manage", type: "admin", group: "roles", description: "Manage roles and assign permissions" },
    { code: "admin.logs.view", type: "admin", group: "logs", description: "View platform global audit logs" },
    // Client portal permissions
    { code: "client.dashboard.view", type: "client", group: "dashboard", description: "View client overview dashboard" },
    { code: "apikeys.view", type: "client", group: "apikeys", description: "View API keys" },
    { code: "apikeys.create", type: "client", group: "apikeys", description: "Generate new API keys" },
    { code: "apikeys.revoke", type: "client", group: "apikeys", description: "Revoke API keys" },
    { code: "team.view", type: "client", group: "team", description: "View organization team members" },
    { code: "team.invite", type: "client", group: "team", description: "Invite new team members" },
    { code: "team.remove", type: "client", group: "team", description: "Remove team members" },
    { code: "client.logs.view", type: "client", group: "logs", description: "View organization audit trail" },
  ];

  for (const perm of permissionsData) {
    const existing = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.code, perm.code))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(permissions).values(perm);
    }
  }

  // 2. Seed Roles
  const rolesData = [
    { name: "Superadmin", type: "admin", description: "Full backoffice system administration access" },
    { name: "Client Owner", type: "client", description: "Organization owner with team and key management" },
    { name: "Client Developer", type: "client", description: "Technical staff with API key management" },
    { name: "Client Finance", type: "client", description: "Billing and reporting access" },
  ];

  for (const r of rolesData) {
    const existing = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, r.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(roles).values(r);
    }
  }

  // 3. Map Permissions to Roles
  const allPerms = await db.select().from(permissions);
  const allRoles = await db.select().from(roles);

  const superadminRole = allRoles.find((r) => r.name === "Superadmin");
  const clientOwnerRole = allRoles.find((r) => r.name === "Client Owner");
  const clientDevRole = allRoles.find((r) => r.name === "Client Developer");
  const clientFinanceRole = allRoles.find((r) => r.name === "Client Finance");

  const assignPerms = async (roleId: number, permCodes: string[]) => {
    for (const code of permCodes) {
      const p = allPerms.find((perm) => perm.code === code);
      if (!p) continue;
      try {
        await db
          .insert(rolePermissions)
          .values({ roleId, permissionId: p.id })
          .onConflictDoNothing();
      } catch {
        // Ignore duplicate inserts
      }
    }
  };

  if (superadminRole) {
    // Superadmin gets everything
    await assignPerms(
      superadminRole.id,
      allPerms.map((p) => p.code),
    );
  }

  if (clientOwnerRole) {
    await assignPerms(clientOwnerRole.id, [
      "clients.view",
      "apikeys.view",
      "apikeys.create",
      "apikeys.revoke",
      "team.view",
      "team.invite",
      "team.remove",
      "client.logs.view",
    ]);
  }

  if (clientDevRole) {
    await assignPerms(clientDevRole.id, [
      "clients.view",
      "apikeys.view",
      "apikeys.create",
      "apikeys.revoke",
    ]);
  }

  if (clientFinanceRole) {
    await assignPerms(clientFinanceRole.id, ["clients.view"]);
  }

  // 4. Attach Superadmin role to default admin user (admin@example.com) if exists
  if (superadminRole) {
    const defaultAdmin = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "admin@example.com"))
      .limit(1);

    if (defaultAdmin.length > 0 && defaultAdmin[0]) {
      try {
        await db
          .insert(userRoles)
          .values({ userId: defaultAdmin[0].id, roleId: superadminRole.id })
          .onConflictDoNothing();
      } catch {
        // Ignore duplicate
      }
    }
  }

  logger.info("[RbacSeeder] Roles and permissions seeded successfully");
};
