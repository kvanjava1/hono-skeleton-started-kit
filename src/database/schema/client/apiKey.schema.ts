import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { clients } from "./client.schema.ts";
import { users } from "../admin/user.schema.ts";
import { accountStatuses } from "../common/status.schema.ts";
import { permissions } from "../admin/rbac.schema.ts";

/**
 * API Keys (Secret credentials used for machine-to-machine API access).
 * Uses SHA-256 hash storage; raw secret is shown only once at creation time.
 */
export const apiKeys = sqliteTable("api_keys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  keyPrefix: text("key_prefix").notNull(), // e.g. "hon_live_ab12cd34" (first 16 chars)
  secretHash: text("secret_hash").notNull().unique(), // SHA-256 hash of the complete raw token
  status: text("status")
    .notNull()
    .default("ACTIVE")
    .references(() => accountStatuses.code),
  lastUsedAt: text("last_used_at"),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

/**
 * API Key Permissions (Scopes for fine-grained API key access control).
 */
export const apiKeyPermissions = sqliteTable(
  "api_key_permissions",
  {
    apiKeyId: integer("api_key_id")
      .notNull()
      .references(() => apiKeys.id, { onDelete: "cascade" }),
    permissionId: integer("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.apiKeyId, table.permissionId] }),
  }),
);

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type ApiKeyPermission = typeof apiKeyPermissions.$inferSelect;
export type NewApiKeyPermission = typeof apiKeyPermissions.$inferInsert;
