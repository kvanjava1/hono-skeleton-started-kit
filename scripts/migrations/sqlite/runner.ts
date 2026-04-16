import { getSqliteDb } from "../../../src/database/sqlite.connection.ts";
import type { SqliteConnectionName } from "../../../src/configs/index.ts";

const CREATE_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    executed_at TEXT DEFAULT (datetime('now'))
  )
`;

export interface SqliteMigration {
  name: string;
  target: SqliteConnectionName;
  up: (db: ReturnType<typeof getSqliteDb>) => Promise<void>;
  down: (db: ReturnType<typeof getSqliteDb>) => Promise<void>;
}

export const createMigrationsTable = (connectionName: SqliteConnectionName): void => {
  const db = getSqliteDb(connectionName);
  db.run(CREATE_MIGRATIONS_TABLE);
};

export const getExecutedMigrations = (
  connectionName: SqliteConnectionName,
): string[] => {
  const db = getSqliteDb(connectionName);
  const rows = db
    .query<{ name: string }, []>("SELECT name FROM migrations ORDER BY id")
    .all();
  return rows.map((row) => row.name);
};

export const markMigrationAsExecuted = (
  connectionName: SqliteConnectionName,
  name: string,
): void => {
  const db = getSqliteDb(connectionName);
  db.run("INSERT INTO migrations (name) VALUES (?)", [name]);
};

export const unmarkMigrationAsExecuted = (
  connectionName: SqliteConnectionName,
  name: string,
): void => {
  const db = getSqliteDb(connectionName);
  db.run("DELETE FROM migrations WHERE name = ?", [name]);
};
