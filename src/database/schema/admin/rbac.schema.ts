import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { users } from "./user.schema.ts";

/**
 * RBAC: Roles table (Spatie-style).
 * Categorized by `type` ('admin' for backoffice, 'client' for client portal).
 */
export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull().default("admin"), // 'admin' | 'client'
  description: text("description"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

/**
 * RBAC: Atomic permissions catalog.
 * e.g., code: 'clients.view', 'users.create', 'apikeys.view'.
 */
export const permissions = sqliteTable("permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  group: text("group").notNull(), // e.g. 'users', 'clients', 'apikeys', 'team'
  description: text("description"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

/**
 * RBAC: Pivot table linking roles to permissions.
 */
export const rolePermissions = sqliteTable(
  "role_permissions",
  {
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: integer("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  }),
);

/**
 * RBAC: Pivot table linking users to roles (specifically for admin backoffice).
 */
export const userRoles = sqliteTable(
  "user_roles",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
  }),
);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
