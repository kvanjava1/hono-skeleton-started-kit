import { and, count, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { getDrizzleDb } from "../../database/drizzle.ts";
import {
  clients,
  clientMembers,
  type Client,
  type NewClient,
} from "../../database/schema/client/client.schema.ts";
import { apiKeys } from "../../database/schema/client/apiKey.schema.ts";
import { users } from "../../database/schema/admin/user.schema.ts";
import { roles } from "../../database/schema/admin/rbac.schema.ts";

export type { Client, NewClient };

export interface ClientListQuery {
  q?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface ClientListItem extends Client {
  membersCount: number;
  apiKeysCount: number;
}

export interface ClientListResult {
  rows: ClientListItem[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
}

export const findAllClients = async (
  query: ClientListQuery = {},
): Promise<ClientListResult> => {
  const db = await getDrizzleDb("sqlite1");
  const page = Math.max(1, Math.trunc(query.page ?? 1));
  const perPage = Math.min(100, Math.max(1, Math.trunc(query.perPage ?? 10)));

  const conditions = [isNull(clients.deletedAt)];
  if (query.q) {
    const pattern = `%${query.q}%`;
    conditions.push(or(like(clients.name, pattern), like(clients.slug, pattern))!);
  }
  if (query.status) {
    conditions.push(eq(clients.status, query.status.toUpperCase()));
  }
  const where = and(...conditions);

  const clientRows = await db
    .select()
    .from(clients)
    .where(where)
    .orderBy(desc(clients.id))
    .limit(perPage)
    .offset((page - 1) * perPage);

  const [totals] = await db
    .select({ value: count() })
    .from(clients)
    .where(where);

  const total = Number(totals?.value ?? 0);
  const lastPage = Math.max(1, Math.ceil(total / perPage));

  // Fetch counts for members and api_keys for each client
  const rows: ClientListItem[] = await Promise.all(
    clientRows.map(async (client) => {
      const [membersCountResult] = await db
        .select({ value: count() })
        .from(clientMembers)
        .where(eq(clientMembers.clientId, client.id));

      const [apiKeysCountResult] = await db
        .select({ value: count() })
        .from(apiKeys)
        .where(eq(apiKeys.clientId, client.id));

      return {
        ...client,
        membersCount: Number(membersCountResult?.value ?? 0),
        apiKeysCount: Number(apiKeysCountResult?.value ?? 0),
      };
    }),
  );

  return {
    rows,
    total,
    page,
    perPage,
    lastPage,
  };
};

export const findClientById = async (id: number): Promise<Client | null> => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), isNull(clients.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
};

export const findClientBySlug = async (slug: string): Promise<Client | null> => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db
    .select()
    .from(clients)
    .where(and(eq(clients.slug, slug), isNull(clients.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
};

export const findClientByUserId = async (userId: number): Promise<Client | null> => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db
    .select({ client: clients })
    .from(clientMembers)
    .innerJoin(clients, eq(clientMembers.clientId, clients.id))
    .where(and(eq(clientMembers.userId, userId), isNull(clients.deletedAt)))
    .limit(1);

  return rows[0]?.client ?? null;
};

export const findClientMembers = async (clientId: number) => {
  const db = await getDrizzleDb("sqlite1");
  return db
    .select({
      id: clientMembers.id,
      userId: clientMembers.userId,
      roleId: clientMembers.roleId,
      name: users.name,
      email: users.email,
      roleName: roles.name,
      status: clientMembers.status,
      createdAt: clientMembers.createdAt,
    })
    .from(clientMembers)
    .innerJoin(users, eq(clientMembers.userId, users.id))
    .innerJoin(roles, eq(clientMembers.roleId, roles.id))
    .where(eq(clientMembers.clientId, clientId));
};

export const findClientMemberById = async (memberId: number) => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db
    .select({
      id: clientMembers.id,
      clientId: clientMembers.clientId,
      userId: clientMembers.userId,
      roleId: clientMembers.roleId,
      name: users.name,
      email: users.email,
      roleName: roles.name,
      status: clientMembers.status,
      createdAt: clientMembers.createdAt,
    })
    .from(clientMembers)
    .innerJoin(users, eq(clientMembers.userId, users.id))
    .innerJoin(roles, eq(clientMembers.roleId, roles.id))
    .where(eq(clientMembers.id, memberId))
    .limit(1);
  return rows[0] ?? null;
};

export const updateClientMemberById = async (
  memberId: number,
  data: { roleId?: number; status?: string },
) => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db
    .update(clientMembers)
    .set({ ...data, updatedAt: sql`datetime('now')` })
    .where(eq(clientMembers.id, memberId))
    .returning();
  return rows[0] ?? null;
};

export const findClientApiKeys = async (clientId: number) => {
  const db = await getDrizzleDb("sqlite1");
  return db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      status: apiKeys.status,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
      creatorName: users.name,
    })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.createdBy, users.id))
    .where(eq(apiKeys.clientId, clientId))
    .orderBy(desc(apiKeys.id));
};

export const insertClient = async (data: NewClient): Promise<Client> => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db.insert(clients).values(data).returning();
  return rows[0]!;
};

export const updateClientById = async (
  id: number,
  data: Partial<NewClient>,
): Promise<Client | null> => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db
    .update(clients)
    .set({ ...data, updatedAt: sql`datetime('now')` })
    .where(and(eq(clients.id, id), isNull(clients.deletedAt)))
    .returning();
  return rows[0] ?? null;
};

export const softDeleteClientById = async (id: number): Promise<boolean> => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db
    .update(clients)
    .set({ deletedAt: sql`datetime('now')` })
    .where(and(eq(clients.id, id), isNull(clients.deletedAt)))
    .returning();
  return rows.length > 0;
};
