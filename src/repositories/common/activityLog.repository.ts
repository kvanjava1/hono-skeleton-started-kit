import { and, count, desc, eq, inArray, like, or } from "drizzle-orm";
import { getDrizzleDb } from "../../database/drizzle.ts";
import {
  activityLogs,
  type ActivityLog,
  type NewActivityLog,
} from "../../database/schema/common/activityLog.schema.ts";
import { clients } from "../../database/schema/client/client.schema.ts";

export type { ActivityLog, NewActivityLog };

export interface ActivityLogItem extends ActivityLog {
  clientName?: string | null;
}

export interface ActivityLogQuery {
  clientId?: number;
  actorId?: number;
  actorType?: string;
  scope?: string;
  scopes?: string[];
  action?: string;
  q?: string;
  page?: number;
  perPage?: number;
}

export interface ActivityLogResult {
  rows: ActivityLogItem[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
}

export const insertActivityLog = async (
  input: NewActivityLog,
): Promise<ActivityLog> => {
  const db = await getDrizzleDb("sqlite1");
  const [created] = await db.insert(activityLogs).values(input).returning();
  return created!;
};

export const findActivityLogs = async (
  query: ActivityLogQuery = {},
): Promise<ActivityLogResult> => {
  const db = await getDrizzleDb("sqlite1");
  const page = Math.max(1, Math.trunc(query.page ?? 1));
  const perPage = Math.min(100, Math.max(1, Math.trunc(query.perPage ?? 15)));

  const conditions: any[] = [];

  if (query.clientId !== undefined) {
    conditions.push(eq(activityLogs.clientId, query.clientId));
  }

  if (query.actorId !== undefined) {
    conditions.push(eq(activityLogs.actorId, query.actorId));
  }

  if (query.actorType) {
    conditions.push(eq(activityLogs.actorType, query.actorType));
  }

  if (query.scope) {
    conditions.push(eq(activityLogs.scope, query.scope));
  } else if (query.scopes && query.scopes.length > 0) {
    conditions.push(inArray(activityLogs.scope, query.scopes));
  }

  if (query.action) {
    conditions.push(eq(activityLogs.action, query.action));
  }

  if (query.q) {
    const pattern = `%${query.q}%`;
    conditions.push(
      or(
        like(activityLogs.description, pattern),
        like(activityLogs.action, pattern),
        like(activityLogs.actorName, pattern),
        like(activityLogs.actorEmail, pattern),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRes] = await db
    .select({ count: count() })
    .from(activityLogs)
    .where(where);

  const total = totalRes?.count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / perPage));

  const rows = await db
    .select({
      id: activityLogs.id,
      clientId: activityLogs.clientId,
      actorId: activityLogs.actorId,
      actorType: activityLogs.actorType,
      actorName: activityLogs.actorName,
      actorEmail: activityLogs.actorEmail,
      action: activityLogs.action,
      scope: activityLogs.scope,
      description: activityLogs.description,
      ipAddress: activityLogs.ipAddress,
      userAgent: activityLogs.userAgent,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
      clientName: clients.name,
    })
    .from(activityLogs)
    .leftJoin(clients, eq(activityLogs.clientId, clients.id))
    .where(where)
    .orderBy(desc(activityLogs.id))
    .limit(perPage)
    .offset((page - 1) * perPage);

  return {
    rows,
    total,
    page,
    perPage,
    lastPage,
  };
};
