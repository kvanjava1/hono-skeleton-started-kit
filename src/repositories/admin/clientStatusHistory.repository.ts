import { desc, eq } from "drizzle-orm";
import { getDrizzleDb } from "../../database/drizzle.ts";
import {
  clientStatusHistories,
  type ClientStatusHistory,
  type NewClientStatusHistory,
} from "../../database/schema/client/clientStatusHistory.schema.ts";
import { users } from "../../database/schema/admin/user.schema.ts";

export interface ClientStatusHistoryWithActor extends ClientStatusHistory {
  changedByName?: string | null;
  changedByEmail?: string | null;
}

export const insertClientStatusHistory = async (
  input: NewClientStatusHistory,
): Promise<ClientStatusHistory> => {
  const db = await getDrizzleDb("sqlite1");
  const [created] = await db
    .insert(clientStatusHistories)
    .values(input)
    .returning();
  return created!;
};

export const findClientStatusHistoriesByClientId = async (
  clientId: number,
): Promise<ClientStatusHistoryWithActor[]> => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db
    .select({
      id: clientStatusHistories.id,
      clientId: clientStatusHistories.clientId,
      fromStatus: clientStatusHistories.fromStatus,
      toStatus: clientStatusHistories.toStatus,
      reason: clientStatusHistories.reason,
      suspendedUntil: clientStatusHistories.suspendedUntil,
      changedBy: clientStatusHistories.changedBy,
      createdAt: clientStatusHistories.createdAt,
      changedByName: users.name,
      changedByEmail: users.email,
    })
    .from(clientStatusHistories)
    .leftJoin(users, eq(clientStatusHistories.changedBy, users.id))
    .where(eq(clientStatusHistories.clientId, clientId))
    .orderBy(desc(clientStatusHistories.id));

  return rows;
};
