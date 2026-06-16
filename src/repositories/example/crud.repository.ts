import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { getDrizzleDb } from "../../database/drizzle.ts";
import { cruds, type Crud, type CreateCrudInput, type UpdateCrudInput } from "../../database/schema/example/crud.ts";

export type { Crud, CreateCrudInput, UpdateCrudInput };

export const getAllCruds = async (): Promise<Crud[]> => {
  const db = await getDrizzleDb();
  return db
    .select()
    .from(cruds)
    .where(isNull(cruds.deletedAt))
    .orderBy(desc(cruds.id));
};

export const getCrudById = async (id: number): Promise<Crud | null> => {
  const db = await getDrizzleDb();
  const rows = await db
    .select()
    .from(cruds)
    .where(and(eq(cruds.id, id), isNull(cruds.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
};

export const createCrud = async (input: CreateCrudInput): Promise<Crud> => {
  const db = await getDrizzleDb();
  const rows = await db.insert(cruds).values(input).returning();
  return rows[0]!;
};

export const updateCrud = async (id: number, input: UpdateCrudInput): Promise<Crud | null> => {
  const db = await getDrizzleDb();

  if (Object.keys(input).length === 0) {
    return getCrudById(id);
  }

  const rows = await db
    .update(cruds)
    .set({ ...input, updatedAt: sql`datetime('now')` })
    .where(and(eq(cruds.id, id), isNull(cruds.deletedAt)))
    .returning();

  return rows[0] ?? null;
};

export const deleteCrud = async (id: number): Promise<boolean> => {
  const db = await getDrizzleDb();
  const rows = await db
    .update(cruds)
    .set({ deletedAt: sql`datetime('now')` })
    .where(and(eq(cruds.id, id), isNull(cruds.deletedAt)))
    .returning();

  return rows.length > 0;
};
