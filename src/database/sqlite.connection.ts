import { Database } from "bun:sqlite";
import {
  configSqlite,
  configApp,
  getSqliteConnectionNames,
  type SqliteConnectionName,
} from "../configs/index.ts";
import { logger } from "../utils/logger.util.ts";
import { mkdir } from "fs/promises";
import * as path from "path";

const sqliteConnections = new Map<SqliteConnectionName, Database>();

const isSqliteEnabled = (): boolean => {
  const envValue = process.env.DB_SQLITE_ENABLED?.trim().toLowerCase();
  if (envValue !== undefined) {
    return envValue === "true" || envValue === "1" || envValue === "yes";
  }
  return configApp.db.sqlite;
};

const ensureDirectoryExists = async (filePath: string): Promise<void> => {
  if (filePath === ":memory:") {
    return;
  }

  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
};

const getSqliteConfig = (name: SqliteConnectionName) => {
  return configSqlite()[name];
};

const getSqliteDbPath = (name: SqliteConnectionName): string => {
  return getSqliteConfig(name).dbPath;
};

export const createSqliteConnection = async (
  name: SqliteConnectionName,
): Promise<Database> => {
  if (!isSqliteEnabled()) {
    throw new Error(
      "SQLite is disabled in configuration. Enable DB_SQLITE_ENABLED=true in your .env file.",
    );
  }

  const existingConnection = sqliteConnections.get(name);
  if (existingConnection) {
    return existingConnection;
  }

  const dbPath = getSqliteDbPath(name);
  await ensureDirectoryExists(dbPath);

  const db = new Database(dbPath);
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA busy_timeout = 10000"); // Wait up to 10 seconds if the DB is locked

  sqliteConnections.set(name, db);

  logger.info(`SQLite connection "${name}" connected to ${dbPath}`);
  return db;
};

export const createAllSqliteConnections = async (): Promise<Record<
  SqliteConnectionName,
  Database
>> => {
  const connectionNames = getSqliteConnectionNames();
  const entries = await Promise.all(
    connectionNames.map(async (name) => [name, await createSqliteConnection(name)] as const),
  );

  return Object.fromEntries(entries) as Record<SqliteConnectionName, Database>;
};

export const getSqliteDb = async (name: SqliteConnectionName): Promise<Database> => {
  const existingConnection = sqliteConnections.get(name);
  if (!existingConnection) {
    return createSqliteConnection(name);
  }

  return existingConnection;
};

export const closeSqliteConnection = (name: SqliteConnectionName): void => {
  const connection = sqliteConnections.get(name);
  if (connection) {
    connection.close();
    sqliteConnections.delete(name);
    logger.info(`SQLite connection "${name}" closed`);
  }
};

export const closeAllSqliteConnections = async (): Promise<void> => {
  for (const name of getSqliteConnectionNames()) {
    closeSqliteConnection(name);
  }
};

export const testSqliteConnection = async (name: SqliteConnectionName): Promise<boolean> => {
  try {
    const database = await getSqliteDb(name);
    database.query("SELECT 1").get();
    logger.info(`SQLite connection "${name}" test successful`);
    return true;
  } catch (error) {
    logger.error(`SQLite connection "${name}" test failed`, error);
    return false;
  }
};

export const testAllSqliteConnections = async (): Promise<boolean> => {
  for (const name of getSqliteConnectionNames()) {
    const isOk = await testSqliteConnection(name);
    if (!isOk) return false;
  }
  return true;
};
