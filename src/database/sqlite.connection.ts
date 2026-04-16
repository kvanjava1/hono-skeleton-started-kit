import { Database } from "bun:sqlite";
import {
  configSqlite,
  configApp,
  getSqliteConnectionNames,
  type SqliteConnectionName,
} from "../configs/index.ts";
import { logger } from "../utils/logger.util.ts";
import * as fs from "fs";
import * as path from "path";

const sqliteConnections = new Map<SqliteConnectionName, Database>();

const isSqliteEnabled = (): boolean => {
  const value = process.env.DB_SQLITE_ENABLED?.trim().toLowerCase();
  if (value === undefined) {
    return configApp.db.sqlite;
  }

  return value === "true" || value === "1" || value === "yes";
};

const ensureDirectoryExists = (filePath: string): void => {
  if (filePath === ":memory:") {
    return;
  }

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const getSqliteConfig = (name: SqliteConnectionName) => {
  return configSqlite()[name];
};

const getSqliteDbPath = (name: SqliteConnectionName): string => {
  const sqliteConfig = getSqliteConfig(name);
  return process.env[sqliteConfig.envKey] ?? sqliteConfig.dbPath;
};

export const createSqliteConnection = (
  name: SqliteConnectionName,
): Database => {
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
  ensureDirectoryExists(dbPath);

  const db = new Database(dbPath);
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA busy_timeout = 10000"); // Wait up to 10 seconds if the DB is locked

  sqliteConnections.set(name, db);

  logger.info(`SQLite connection "${name}" connected to ${dbPath}`);
  return db;
};

export const createAllSqliteConnections = (): Record<
  SqliteConnectionName,
  Database
> => {
  const connectionNames = getSqliteConnectionNames();

  return Object.fromEntries(
    connectionNames.map((name) => [name, createSqliteConnection(name)]),
  ) as Record<SqliteConnectionName, Database>;
};

export const getSqliteDb = (name: SqliteConnectionName): Database => {
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

export const closeAllSqliteConnections = (): void => {
  for (const name of getSqliteConnectionNames()) {
    closeSqliteConnection(name);
  }
};

export const testSqliteConnection = (name: SqliteConnectionName): boolean => {
  try {
    const database = getSqliteDb(name);
    database.query("SELECT 1").get();
    logger.info(`SQLite connection "${name}" test successful`);
    return true;
  } catch (error) {
    logger.error(`SQLite connection "${name}" test failed`, error);
    return false;
  }
};

export const testAllSqliteConnections = (): boolean => {
  return getSqliteConnectionNames().every((name) => testSqliteConnection(name));
};
