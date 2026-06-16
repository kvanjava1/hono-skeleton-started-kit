import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { getSqliteDb } from "./sqlite.connection.ts";
import type { SqliteConnectionName } from "../configs/index.ts";

const drizzleClients = new Map<SqliteConnectionName, BunSQLiteDatabase>();

export const getDrizzleDb = async (
  name: SqliteConnectionName = "sqlite1",
): Promise<BunSQLiteDatabase> => {
  const existing = drizzleClients.get(name);
  if (existing) return existing;

  const sqliteDb = await getSqliteDb(name);
  const db = drizzle(sqliteDb);
  drizzleClients.set(name, db);
  return db;
};

export const closeDrizzleDb = (name: SqliteConnectionName): void => {
  drizzleClients.delete(name);
};

export const closeAllDrizzleDbs = (): void => {
  drizzleClients.clear();
};
