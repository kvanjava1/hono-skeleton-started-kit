import type { Database } from "bun:sqlite";
import { getSqliteDb } from "../../database/sqlite.connection.ts";

export interface Crud {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type CreateCrudInput = Pick<Crud, "title" | "content">;
export type UpdateCrudInput = Partial<CreateCrudInput>;

const getDb = async (): Promise<Database> => getSqliteDb("sqlite1");

export const getAllCruds = async (): Promise<Crud[]> => {
  const db = await getDb();
  return db.query("SELECT * FROM cruds WHERE deleted_at IS NULL ORDER BY id DESC").all() as Crud[];
};

export const getCrudById = async (id: number): Promise<Crud | null> => {
  const db = await getDb();
  return db.query("SELECT * FROM cruds WHERE id = ? AND deleted_at IS NULL").get(id) as Crud | null;
};

export const createCrud = async (input: CreateCrudInput): Promise<Crud> => {
  const db = await getDb();
  const info = db
    .prepare("INSERT INTO cruds (title, content) VALUES (?, ?)")
    .run(input.title, input.content);

  return (await getCrudById(Number(info.lastInsertRowid)))!;
};

export const updateCrud = async (id: number, input: UpdateCrudInput): Promise<Crud | null> => {
  const db = await getDb();
  const sets: string[] = [];
  const values: (string | number)[] = [];

  if (input.title !== undefined) { sets.push("title = ?"); values.push(input.title); }
  if (input.content !== undefined) { sets.push("content = ?"); values.push(input.content); }

  if (sets.length === 0) return getCrudById(id);

  sets.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE cruds SET ${sets.join(", ")} WHERE id = ? AND deleted_at IS NULL`).run(...values);

  return getCrudById(id);
};

export const deleteCrud = async (id: number): Promise<boolean> => {
  const db = await getDb();
  const info = db
    .prepare("UPDATE cruds SET deleted_at = datetime('now') WHERE id = ? AND deleted_at IS NULL")
    .run(id);
  return Number(info.changes) > 0;
};
