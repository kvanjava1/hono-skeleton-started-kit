import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDrizzleDb } from "../../database/drizzle.ts";
import {
  apiKeys,
  apiKeyPermissions,
  type ApiKey,
  type NewApiKey,
} from "../../database/schema/client/apiKey.schema.ts";
import { clients, type Client } from "../../database/schema/client/client.schema.ts";
import { permissions } from "../../database/schema/admin/rbac.schema.ts";

export type { ApiKey, NewApiKey };

export interface ApiKeyWithClient {
  key: ApiKey;
  client: Client;
}

export const insertApiKey = async (
  data: NewApiKey,
  permissionIds: number[] = [],
): Promise<ApiKey> => {
  const db = await getDrizzleDb("sqlite1");
  const [created] = await db.insert(apiKeys).values(data).returning();

  if (permissionIds.length > 0 && created) {
    for (const permissionId of permissionIds) {
      try {
        await db
          .insert(apiKeyPermissions)
          .values({ apiKeyId: created.id, permissionId })
          .onConflictDoNothing();
      } catch {
        // ignore duplicate
      }
    }
  }

  return created!;
};

export const findApiKeyByHash = async (
  secretHash: string,
): Promise<ApiKeyWithClient | null> => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db
    .select({
      key: apiKeys,
      client: clients,
    })
    .from(apiKeys)
    .innerJoin(clients, eq(apiKeys.clientId, clients.id))
    .where(and(eq(apiKeys.secretHash, secretHash), isNull(clients.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
};

export const findApiKeysByClientId = async (
  clientId: number,
): Promise<ApiKey[]> => {
  const db = await getDrizzleDb("sqlite1");
  return db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.clientId, clientId))
    .orderBy(desc(apiKeys.id));
};

export const findApiKeyPermissions = async (
  apiKeyId: number,
): Promise<string[]> => {
  const db = await getDrizzleDb("sqlite1");
  const permRows = await db
    .select({ code: permissions.code })
    .from(apiKeyPermissions)
    .innerJoin(permissions, eq(apiKeyPermissions.permissionId, permissions.id))
    .where(eq(apiKeyPermissions.apiKeyId, apiKeyId));

  return permRows.map((p) => p.code);
};

export const updateApiKeyStatus = async (
  id: number,
  status: string,
): Promise<ApiKey | null> => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db
    .update(apiKeys)
    .set({ status })
    .where(eq(apiKeys.id, id))
    .returning();
  return rows[0] ?? null;
};

export const touchApiKeyLastUsed = async (id: number): Promise<void> => {
  const db = await getDrizzleDb("sqlite1");
  await db
    .update(apiKeys)
    .set({ lastUsedAt: sql`datetime('now')` })
    .where(eq(apiKeys.id, id));
};

export const deleteApiKeyById = async (id: number): Promise<boolean> => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db.delete(apiKeys).where(eq(apiKeys.id, id)).returning();
  return rows.length > 0;
};
