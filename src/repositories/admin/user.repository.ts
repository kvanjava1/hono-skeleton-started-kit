import { and, count, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { getDrizzleDb } from "../../database/drizzle.ts";
import {
  users,
  type User,
  type NewUser,
} from "../../database/schema/admin/user.schema.ts";

export type { User, NewUser };

export interface UserCreateInput {
  name: string;
  email: string;
  passwordHash: string;
  isActive?: boolean;
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
  passwordHash?: string;
  isActive?: boolean;
}

export interface UserListQuery {
  /** Search term matched against name and email (SQL LIKE %q%). */
  q?: string;
  /** "active" | "inactive" — omitted means all non-deleted users. */
  status?: "active" | "inactive";
  page?: number;
  perPage?: number;
}

export interface UserListResult {
  rows: User[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
}

export const findAllUsers = async (
  query: UserListQuery = {},
): Promise<UserListResult> => {
  const db = await getDrizzleDb("sqlite1");
  const page = Math.max(1, Math.trunc(query.page ?? 1));
  const perPage = Math.min(100, Math.max(1, Math.trunc(query.perPage ?? 10)));

  const conditions = [isNull(users.deletedAt)];
  if (query.q) {
    const pattern = `%${query.q}%`;
    conditions.push(
      or(like(users.name, pattern), like(users.email, pattern))!,
    );
  }
  if (query.status) {
    conditions.push(eq(users.isActive, query.status === "active"));
  }
  const where = and(...conditions);

  const rows = await db
    .select()
    .from(users)
    .where(where)
    .orderBy(desc(users.id))
    .limit(perPage)
    .offset((page - 1) * perPage);

  const [totals] = await db
    .select({ value: count() })
    .from(users)
    .where(where);
  const total = totals?.value ?? 0;

  return { rows, total, page, perPage, lastPage: Math.max(1, Math.ceil(total / perPage)) };
};

export const findUserById = async (id: number): Promise<User | null> => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
};

export const insertUser = async (input: UserCreateInput): Promise<User> => {
  const db = await getDrizzleDb("sqlite1");
  const values: NewUser = {
    name: input.name,
    email: input.email,
    passwordHash: input.passwordHash,
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  };
  const rows = await db.insert(users).values(values).returning();
  return rows[0]!;
};

export const updateUserById = async (
  id: number,
  input: UserUpdateInput,
): Promise<User | null> => {
  const db = await getDrizzleDb("sqlite1");

  if (Object.keys(input).length === 0) {
    return findUserById(id);
  }

  const rows = await db
    .update(users)
    .set({ ...input, updatedAt: sql`datetime('now')` })
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning();

  return rows[0] ?? null;
};

export const softDeleteUserById = async (id: number): Promise<boolean> => {
  const db = await getDrizzleDb("sqlite1");
  const rows = await db
    .update(users)
    .set({ deletedAt: sql`datetime('now')` })
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning();
  return rows.length > 0;
};
