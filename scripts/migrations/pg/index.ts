import { createMigrationRunner } from "../shared.ts";
import {
  createAllPgConnections,
  getPgSql,
  closeAllPgConnections,
} from "../../../src/database/pg.connection.ts";
import { getPgConnectionNames } from "../../../src/configs/index.ts";
import {
  createMigrationsTable,
  getExecutedMigrations,
  markMigrationAsExecuted,
  unmarkMigrationAsExecuted,
} from "./runner.ts";
import type { PgConnectionName } from "../../../src/configs/index.ts";
import type { PgMigration } from "./runner.ts";
import * as path from "path";

const MIGRATIONS_DIR = "./scripts/migrations/pg/files";

export const pgRunner = createMigrationRunner({
  name: "PostgreSQL",
  migrationsDir: MIGRATIONS_DIR,
  getConnectionNames: getPgConnectionNames as () => string[],
  createAllConnections: async () => { createAllPgConnections(); },
  closeAllConnections: async () => { await closeAllPgConnections(); },
  getConnection: (name: string) => getPgSql(name as PgConnectionName),
  createMigrationsTable: (name: string) =>
    createMigrationsTable(name as PgConnectionName),
  getExecutedMigrations: (name: string) =>
    getExecutedMigrations(name as PgConnectionName),
  markMigrationAsExecuted: (name: string, migrationName: string) =>
    markMigrationAsExecuted(name as PgConnectionName, migrationName),
  unmarkMigrationAsExecuted: (name: string, migrationName: string) =>
    unmarkMigrationAsExecuted(name as PgConnectionName, migrationName),
  loadMigration: async (file: string) => {
    const migration: PgMigration = await import(path.resolve(MIGRATIONS_DIR, file));
    if (!getPgConnectionNames().includes(migration.target as PgConnectionName)) {
      throw new Error(`PostgreSQL migration target "${migration.target}" is invalid.`);
    }
    return migration;
  },
});

export const runPgMigrations = pgRunner.run;
export const runPgMigrationFile = pgRunner.runFile;
export const rollbackPgMigrations = pgRunner.rollback;
export const rollbackPgMigrationFile = pgRunner.rollbackFile;
