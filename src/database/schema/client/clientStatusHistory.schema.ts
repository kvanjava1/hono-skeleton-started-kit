import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { clients } from "./client.schema.ts";
import { users } from "../admin/user.schema.ts";

export const clientStatusHistories = sqliteTable(
  "client_status_histories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    fromStatus: text("from_status").notNull(),
    toStatus: text("to_status").notNull(),
    reason: text("reason"),
    suspendedUntil: text("suspended_until"),
    changedBy: integer("changed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("idx_client_status_histories_client_id").on(table.clientId),
  ],
);

export type ClientStatusHistory = typeof clientStatusHistories.$inferSelect;
export type NewClientStatusHistory = typeof clientStatusHistories.$inferInsert;
