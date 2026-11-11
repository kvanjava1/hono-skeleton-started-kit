import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { accountStatuses } from "../common/status.schema.ts";

/**
 * Admin dashboard users (plan D2/D4: status references account_statuses; soft delete).
 * `password_hash` holds an Argon2id hash produced by `Bun.password.hash`.
 * Uniqueness of `email` is enforced by the partial unique index
 * `users_email_unique` (WHERE deleted_at IS NULL).
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  status: text("status")
    .notNull()
    .default("ACTIVE")
    .references(() => accountStatuses.code),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
