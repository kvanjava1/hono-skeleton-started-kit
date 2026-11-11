import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Universal reference table for account and entity statuses (plan D1/D4).
 * Serves as a foreign-key target for users, clients, client_members, and api_keys.
 * This table is a static lookup dictionary populated via seeders/migrations (no CRUD).
 */
export const ACCOUNT_STATUSES = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
  PENDING: "PENDING",
} as const;

export type AccountStatusCode = (typeof ACCOUNT_STATUSES)[keyof typeof ACCOUNT_STATUSES];

export const accountStatuses = sqliteTable("account_statuses", {
  code: text("code").primaryKey(), // "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING"
  label: text("label").notNull(),
  badgeColor: text("badge_color").notNull().default("emerald"),
  description: text("description"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export type AccountStatus = typeof accountStatuses.$inferSelect;
export type NewAccountStatus = typeof accountStatuses.$inferInsert;
