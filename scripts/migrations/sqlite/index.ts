import { createMigrationRunner } from "../shared.ts";
import {
  createAllSqliteConnections,
  closeAllSqliteConnections,
  getSqliteDb,
} from "../../../src/database/sqlite.connection.ts";
import { getSqliteConnectionNames } from "../../../src/configs/index.ts";
import {
  createMigrationsTable,
  getExecutedMigrations,
  markMigrationAsExecuted,
  unmarkMigrationAsExecuted,
} from "./runner.ts";
import type { SqliteConnectionName } from "../../../src/configs/index.ts";
import type { SqliteMigration } from "./runner.ts";
import * as path from "path";

const MIGRATIONS_DIR = "./scripts/migrations/sqlite/files";

export const sqliteRunner = createMigrationRunner({
  name: "SQLite",
  migrationsDir: MIGRATIONS_DIR,
  getConnectionNames: getSqliteConnectionNames as () => string[],
  createAllConnections: async () => { await createAllSqliteConnections(); },
  closeAllConnections: async () => { await closeAllSqliteConnections(); },
  getConnection: (name: string) => getSqliteDb(name as SqliteConnectionName),
  createMigrationsTable: (name: string) =>
    createMigrationsTable(name as SqliteConnectionName),
  getExecutedMigrations: (name: string) =>
    getExecutedMigrations(name as SqliteConnectionName),
  markMigrationAsExecuted: (name: string, migrationName: string) =>
    markMigrationAsExecuted(name as SqliteConnectionName, migrationName),
  unmarkMigrationAsExecuted: (name: string, migrationName: string) =>
    unmarkMigrationAsExecuted(name as SqliteConnectionName, migrationName),
  loadMigration: async (file: string) => {
    const migration: SqliteMigration = await import(path.resolve(MIGRATIONS_DIR, file));
    const connectionNames = getSqliteConnectionNames();
    if (!connectionNames.includes(migration.target as SqliteConnectionName)) {
      throw new Error(`SQLite migration "${file}" must export target "sqlite1"`);
    }
    return migration;
  },
});

export const runSqliteMigrations = sqliteRunner.run;
export const runSqliteMigrationFile = sqliteRunner.runFile;
export const rollbackSqliteMigrations = sqliteRunner.rollback;
export const rollbackSqliteMigrationFile = sqliteRunner.rollbackFile;
