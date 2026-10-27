import { drizzle as drizzleSqlite, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { drizzle as drizzleMysql, type MySql2Database } from "drizzle-orm/mysql2";
import { drizzle as drizzlePg, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getSqliteDb } from "./sqlite.connection.ts";
import { getMysqlPool } from "./mysql.connection.ts";
import { getPgSql } from "./pg.connection.ts";
import type {
  SqliteConnectionName,
  MysqlConnectionName,
  PgConnectionName,
} from "../configs/index.ts";

const drizzleSqliteClients = new Map<SqliteConnectionName, BunSQLiteDatabase>();
const drizzleMysqlClients = new Map<MysqlConnectionName, MySql2Database>();
const drizzlePgClients = new Map<PgConnectionName, PostgresJsDatabase>();

/**
 * Get or initialize Drizzle ORM client for SQLite
 */
export const getDrizzleSqliteDb = async (
  name: SqliteConnectionName = "sqlite1",
): Promise<BunSQLiteDatabase> => {
  const existing = drizzleSqliteClients.get(name);
  if (existing) return existing;

  const sqliteDb = await getSqliteDb(name);
  const db = drizzleSqlite(sqliteDb);
  drizzleSqliteClients.set(name, db);
  return db;
};

/**
 * Backward-compatible alias for SQLite Drizzle instance
 */
export const getDrizzleDb = getDrizzleSqliteDb;

/**
 * Get or initialize Drizzle ORM client for MySQL
 */
export const getDrizzleMysqlDb = (
  name: MysqlConnectionName = "mysql1",
): MySql2Database => {
  const existing = drizzleMysqlClients.get(name);
  if (existing) return existing;

  const pool = getMysqlPool(name);
  const db = drizzleMysql(pool);
  drizzleMysqlClients.set(name, db);
  return db;
};

/**
 * Get or initialize Drizzle ORM client for PostgreSQL
 */
export const getDrizzlePgDb = (
  name: PgConnectionName = "pg1",
): PostgresJsDatabase => {
  const existing = drizzlePgClients.get(name);
  if (existing) return existing;

  const sql = getPgSql(name);
  const db = drizzlePg(sql);
  drizzlePgClients.set(name, db);
  return db;
};

export const closeDrizzleDb = (name: SqliteConnectionName): void => {
  drizzleSqliteClients.delete(name);
};

export const closeAllDrizzleDbs = (): void => {
  drizzleSqliteClients.clear();
  drizzleMysqlClients.clear();
  drizzlePgClients.clear();
};
