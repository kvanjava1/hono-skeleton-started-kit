import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { accountStatuses } from "../common/status.schema.ts";
import { roles } from "../admin/rbac.schema.ts";
import { clientUsers } from "./clientUser.schema.ts";

/**
 * Clients (Organizations / Companies subscribing to APIs).
 */
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status")
    .notNull()
    .default("ACTIVE")
    .references(() => accountStatuses.code),
  suspendedUntil: text("suspended_until"),
  statusReason: text("status_reason"),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

/**
 * Client Members (Pivot table for team membership in an organization).
 * Links a human user to an organization with a specific role.
 */
export const clientMembers = sqliteTable(
  "client_members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => clientUsers.id, { onDelete: "cascade" }),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    status: text("status")
      .notNull()
      .default("ACTIVE")
      .references(() => accountStatuses.code),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  },
  (table) => ({
    clientUserUnique: uniqueIndex("client_members_client_user_unique").on(
      table.clientId,
      table.userId,
    ),
  }),
);

/**
 * Client Invitations (Pending invitations sent to team members via email).
 */
export const clientInvitations = sqliteTable("client_invitations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  roleId: integer("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "restrict" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type ClientMember = typeof clientMembers.$inferSelect;
export type NewClientMember = typeof clientMembers.$inferInsert;
export type ClientInvitation = typeof clientInvitations.$inferSelect;
export type NewClientInvitation = typeof clientInvitations.$inferInsert;
