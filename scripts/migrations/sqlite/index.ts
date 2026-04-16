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
import { logger } from "../../../src/utils/logger.util.ts";
import * as fs from "fs";
import * as path from "path";
import type { SqliteMigration } from "./runner.ts";

const MIGRATIONS_DIR = "./scripts/migrations/sqlite/files";

const getMigrationFiles = (): string[] => {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    logger.info("Created migrations directory");
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".ts"))
    .sort();
};

const loadSqliteMigration = async (file: string): Promise<SqliteMigration> => {
  const migrationPath = path.join(MIGRATIONS_DIR, file);
  const migration: SqliteMigration = await import(migrationPath);
  const connectionNames = getSqliteConnectionNames();

  if (!connectionNames.includes(migration.target)) {
    throw new Error(
      `SQLite migration "${file}" must export target "sqlite1"`,
    );
  }

  return migration;
};

export const runSqliteMigrations = async (): Promise<void> => {
  logger.info("Running SQLite migrations...");

  try {
    createAllSqliteConnections();
    for (const connectionName of getSqliteConnectionNames()) {
      createMigrationsTable(connectionName);
    }

    const files = getMigrationFiles();
    let ranCount = 0;

    for (const file of files) {
      const migrationName = file.replace(".ts", "");
      const migration = await loadSqliteMigration(file);
      const executed = getExecutedMigrations(migration.target);

      if (executed.includes(migrationName)) {
        logger.debug(
          `Skipping ${migrationName} for ${migration.target} (already executed)`,
        );
        continue;
      }

      logger.info(`Running migration: ${migrationName} on ${migration.target}`);

      const db = getSqliteDb(migration.target);
      await migration.up(db);
      markMigrationAsExecuted(migration.target, migrationName);

      logger.info(`Completed: ${migrationName}`);
      ranCount++;
    }

    if (ranCount === 0) {
      logger.info("No new migrations to run");
    } else {
      logger.info(`Ran ${ranCount} migration(s)`);
    }
  } catch (error) {
    logger.error("SQLite migrations failed", error);
    throw error;
  } finally {
    closeAllSqliteConnections();
  }
};

export const runSqliteMigrationFile = async (
  fileName: string,
): Promise<void> => {
  logger.info(`Running specific SQLite migration: ${fileName}`);

  try {
    createAllSqliteConnections();
    const migrationName = fileName.replace(".ts", "");

    const migrationPath = path.join(MIGRATIONS_DIR, `${fileName}.ts`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migration = await loadSqliteMigration(`${fileName}.ts`);
    createMigrationsTable(migration.target);
    const executed = getExecutedMigrations(migration.target);

    if (executed.includes(migrationName)) {
      logger.info(
        `Migration ${migrationName} already executed for ${migration.target}`,
      );
      return;
    }

    const db = getSqliteDb(migration.target);
    await migration.up(db);
    markMigrationAsExecuted(migration.target, migrationName);

    logger.info(`Completed: ${migrationName}`);
  } catch (error) {
    logger.error("SQLite migration failed", error);
    throw error;
  } finally {
    closeAllSqliteConnections();
  }
};

export const rollbackSqliteMigrations = async (
  steps: number = 1,
): Promise<void> => {
  logger.info(`Rolling back ${steps} SQLite migration(s)...`);

  try {
    createAllSqliteConnections();
    for (const connectionName of getSqliteConnectionNames()) {
      createMigrationsTable(connectionName);
    }

    const files = getMigrationFiles().slice().reverse();
    let rollbackCount = 0;

    for (const file of files) {
      if (rollbackCount >= steps) {
        break;
      }

      const migrationName = file.replace(".ts", "");
      const migration = await loadSqliteMigration(file);
      const executed = getExecutedMigrations(migration.target);

      if (!executed.includes(migrationName)) {
        continue;
      }

      logger.info(`Rolling back: ${migrationName} on ${migration.target}`);
      const db = getSqliteDb(migration.target);
      await migration.down(db);
      unmarkMigrationAsExecuted(migration.target, migrationName);
      logger.info(`Rolled back: ${migrationName}`);
      rollbackCount++;
    }

    if (rollbackCount === 0) {
      logger.info("No migrations to rollback");
      return;
    }
  } catch (error) {
    logger.error("SQLite rollback failed", error);
    throw error;
  } finally {
    closeAllSqliteConnections();
  }
};

export const rollbackSqliteMigrationFile = async (
  fileName: string,
): Promise<void> => {
  logger.info(`Rolling back specific SQLite migration: ${fileName}`);

  try {
    createAllSqliteConnections();
    const migrationName = fileName.replace(".ts", "");

    const migrationPath = path.join(MIGRATIONS_DIR, `${fileName}.ts`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migration = await loadSqliteMigration(`${fileName}.ts`);
    createMigrationsTable(migration.target);

    const db = getSqliteDb(migration.target);
    await migration.down(db);
    unmarkMigrationAsExecuted(migration.target, migrationName);

    logger.info(`Rolled back: ${migrationName}`);
  } catch (error) {
    logger.error("SQLite rollback failed", error);
    throw error;
  } finally {
    closeAllSqliteConnections();
  }
};
