import { desc, eq } from "drizzle-orm";
import { getDrizzleDb } from "../../database/drizzle.ts";
import {
  userStatusHistories,
  type UserStatusHistory,
  type NewUserStatusHistory,
} from "../../database/schema/admin/userStatusHistory.schema.ts";
import { users } from "../../database/schema/admin/user.schema.ts";

export interface StatusHistoryWithActor extends UserStatusHistory {
  changedByName?: string | null;
  changedByEmail?: string | null;
}

export const insertStatusHistory = async (
  input: NewUserStatusHistory,
): Promise<UserStatusHistory> => {
  const db = await getDrizzleDb("sqlite1");
  const [created] = await db
    .insert(userStatusHistories)
    .values(input)
    .returning();
  return created!;
};

export const findStatusHistoriesByUserId = async (
  userId: number,
): Promise<StatusHistoryWithActor[]> => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db
    .select({
      id: userStatusHistories.id,
      userId: userStatusHistories.userId,
      fromStatus: userStatusHistories.fromStatus,
      toStatus: userStatusHistories.toStatus,
      reason: userStatusHistories.reason,
      bannedUntil: userStatusHistories.bannedUntil,
      changedBy: userStatusHistories.changedBy,
      createdAt: userStatusHistories.createdAt,
      changedByName: users.name,
      changedByEmail: users.email,
    })
    .from(userStatusHistories)
    .leftJoin(users, eq(userStatusHistories.changedBy, users.id))
    .where(eq(userStatusHistories.userId, userId))
    .orderBy(desc(userStatusHistories.id));

  return rows;
};
