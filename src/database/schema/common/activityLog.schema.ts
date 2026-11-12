import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { clients } from "../client/client.schema.ts";

export const activityLogs = sqliteTable(
  "activity_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clientId: integer("client_id").references(() => clients.id, {
      onDelete: "cascade",
    }),
    actorId: integer("actor_id"),
    actorType: text("actor_type").notNull().default("client_user"), // 'admin' | 'client_user' | 'system' | 'api_key'
    actorName: text("actor_name"),
    actorEmail: text("actor_email"),
    action: text("action").notNull(), // e.g. 'apikey.create', 'member.invite', 'auth.login'
    scope: text("scope").notNull().default("organization"), // 'global' | 'organization' | 'personal'
    description: text("description").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: text("metadata"), // JSON-stringified context
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("idx_activity_logs_client_id").on(table.clientId, table.createdAt),
    index("idx_activity_logs_actor").on(table.actorType, table.actorId, table.createdAt),
    index("idx_activity_logs_scope").on(table.scope, table.createdAt),
    index("idx_activity_logs_created_at").on(table.createdAt),
  ],
);

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
