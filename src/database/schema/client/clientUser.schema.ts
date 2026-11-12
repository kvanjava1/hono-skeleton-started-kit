import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { accountStatuses } from "../common/status.schema.ts";
import { clients } from "./client.schema.ts";

/**
 * Client portal external users (Tenants / API consumers).
 * Completely separated from platform staff backoffice (`users`).
 */
export const clientUsers = sqliteTable("client_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  status: text("status")
    .notNull()
    .default("ACTIVE")
    .references(() => accountStatuses.code),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  bannedUntil: text("banned_until"),
  statusReason: text("status_reason"),
  lastActiveClientId: integer("last_active_client_id").references(() => clients.id, {
    onDelete: "set null",
  }),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export type ClientUser = typeof clientUsers.$inferSelect;
export type NewClientUser = typeof clientUsers.$inferInsert;
