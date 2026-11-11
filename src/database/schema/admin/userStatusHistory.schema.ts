import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { users } from "./user.schema.ts";

export const userStatusHistories = sqliteTable(
  "user_status_histories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fromStatus: text("from_status").notNull(),
    toStatus: text("to_status").notNull(),
    reason: text("reason"),
    bannedUntil: text("banned_until"),
    changedBy: integer("changed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("idx_user_status_histories_user_id").on(table.userId),
  ],
);

export type UserStatusHistory = typeof userStatusHistories.$inferSelect;
export type NewUserStatusHistory = typeof userStatusHistories.$inferInsert;
