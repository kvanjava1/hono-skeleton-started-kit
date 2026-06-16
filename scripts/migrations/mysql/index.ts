import { createMigrationRunner } from "../shared.ts";
import {
  createAllMysqlPools,
  closeAllMysqlPools,
  getMysqlPool,
} from "../../../src/database/mysql.connection.ts";
import { getMysqlConnectionNames } from "../../../src/configs/index.ts";
import {
  createMigrationsTable,
  getExecutedMigrations,
  markMigrationAsExecuted,
  unmarkMigrationAsExecuted,
} from "./runner.ts";
import type { MysqlConnectionName } from "../../../src/configs/index.ts";
import type { MySqlMigration } from "./runner.ts";
import * as path from "path";

const MIGRATIONS_DIR = "./scripts/migrations/mysql/files";

export const mysqlRunner = createMigrationRunner({
  name: "MySQL",
  migrationsDir: MIGRATIONS_DIR,
  getConnectionNames: getMysqlConnectionNames as () => string[],
  createAllConnections: async () => { createAllMysqlPools(); },
  closeAllConnections: async () => { await closeAllMysqlPools(); },
  getConnection: (name: string) => getMysqlPool(name as MysqlConnectionName),
  createMigrationsTable: (name: string) =>
    createMigrationsTable(name as MysqlConnectionName),
  getExecutedMigrations: (name: string) =>
    getExecutedMigrations(name as MysqlConnectionName),
  markMigrationAsExecuted: (name: string, migrationName: string) =>
    markMigrationAsExecuted(name as MysqlConnectionName, migrationName),
  unmarkMigrationAsExecuted: (name: string, migrationName: string) =>
    unmarkMigrationAsExecuted(name as MysqlConnectionName, migrationName),
  loadMigration: async (file: string) => {
    const migration: MySqlMigration = await import(path.resolve(MIGRATIONS_DIR, file));
    if (!getMysqlConnectionNames().includes(migration.target as MysqlConnectionName)) {
      throw new Error(`MySQL migration target "${migration.target}" is invalid.`);
    }
    return migration;
  },
});

export const runMysqlMigrations = mysqlRunner.run;
export const runMysqlMigrationFile = mysqlRunner.runFile;
export const rollbackMysqlMigrations = mysqlRunner.rollback;
export const rollbackMysqlMigrationFile = mysqlRunner.rollbackFile;
