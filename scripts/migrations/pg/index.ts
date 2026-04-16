import {
  createAllPgConnections,
  getPgSql,
  closeAllPgConnections,
} from "../../../src/database/pg.connection.ts";
import {
  assertPgMigrationTarget,
  createMigrationsTable,
  getExecutedMigrations,
  markMigrationAsExecuted,
  unmarkMigrationAsExecuted,
} from "./runner.ts";
import { logger } from "../../../src/utils/logger.util.ts";
import * as fs from "fs";
import * as path from "path";
import type { PgMigration } from "./runner.ts";

const MIGRATIONS_DIR = "./scripts/migrations/pg/files";

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

const loadPgMigration = async (file: string): Promise<PgMigration> => {
  const migrationPath = path.join(MIGRATIONS_DIR, file);
  const migration: PgMigration = await import(migrationPath);

  assertPgMigrationTarget(migration.target);
  return migration;
};

export const runPgMigrations = async (): Promise<void> => {
  logger.info("Running PostgreSQL migrations...");

  try {
    createAllPgConnections();
    const files = getMigrationFiles();
    let ranCount = 0;

    for (const file of files) {
      const migrationName = file.replace(".ts", "");
      const migration = await loadPgMigration(file);
      await createMigrationsTable(migration.target);
      const executed = await getExecutedMigrations(migration.target);

      if (executed.includes(migrationName)) {
        logger.debug(
          `Skipping ${migrationName} for ${migration.target} (already executed)`,
        );
        continue;
      }

      logger.info(`Running migration: ${migrationName} on ${migration.target}`);

      const sql = getPgSql(migration.target);
      await migration.up(sql);
      await markMigrationAsExecuted(migration.target, migrationName);

      logger.info(`Completed: ${migrationName}`);
      ranCount++;
    }

    if (ranCount === 0) {
      logger.info("No new migrations to run");
    } else {
      logger.info(`Ran ${ranCount} migration(s)`);
    }
  } catch (error) {
    logger.error("PostgreSQL migrations failed", error);
    throw error;
  } finally {
    await closeAllPgConnections();
  }
};

export const runPgMigrationFile = async (fileName: string): Promise<void> => {
  logger.info(`Running specific PostgreSQL migration: ${fileName}`);

  try {
    createAllPgConnections();
    const migrationName = fileName.replace(".ts", "");
    const migrationPath = path.join(MIGRATIONS_DIR, `${fileName}.ts`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migration = await loadPgMigration(`${fileName}.ts`);
    await createMigrationsTable(migration.target);
    const executed = await getExecutedMigrations(migration.target);

    if (executed.includes(migrationName)) {
      logger.info(
        `Migration ${migrationName} already executed for ${migration.target}`,
      );
      return;
    }

    const sql = getPgSql(migration.target);
    await migration.up(sql);
    await markMigrationAsExecuted(migration.target, migrationName);

    logger.info(`Completed: ${migrationName}`);
  } catch (error) {
    logger.error("PostgreSQL migration failed", error);
    throw error;
  } finally {
    await closeAllPgConnections();
  }
};

export const rollbackPgMigrations = async (
  steps: number = 1,
): Promise<void> => {
  logger.info(`Rolling back ${steps} PostgreSQL migration(s)...`);

  try {
    createAllPgConnections();
    const files = getMigrationFiles().slice().reverse();
    let rollbackCount = 0;

    for (const file of files) {
      if (rollbackCount >= steps) {
        break;
      }

      const migrationName = file.replace(".ts", "");
      const migration = await loadPgMigration(file);
      await createMigrationsTable(migration.target);
      const executed = await getExecutedMigrations(migration.target);

      if (!executed.includes(migrationName)) {
        continue;
      }

      logger.info(`Rolling back: ${migrationName} on ${migration.target}`);

      const sql = getPgSql(migration.target);
      await migration.down(sql);
      await unmarkMigrationAsExecuted(migration.target, migrationName);

      logger.info(`Rolled back: ${migrationName}`);
      rollbackCount++;
    }

    if (rollbackCount === 0) {
      logger.info("No migrations to rollback");
    }
  } catch (error) {
    logger.error("PostgreSQL rollback failed", error);
    throw error;
  } finally {
    await closeAllPgConnections();
  }
};

export const rollbackPgMigrationFile = async (
  fileName: string,
): Promise<void> => {
  logger.info(`Rolling back specific PostgreSQL migration: ${fileName}`);

  try {
    createAllPgConnections();
    const migrationName = fileName.replace(".ts", "");
    const migrationPath = path.join(MIGRATIONS_DIR, `${fileName}.ts`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migration = await loadPgMigration(`${fileName}.ts`);
    await createMigrationsTable(migration.target);

    const sql = getPgSql(migration.target);
    await migration.down(sql);
    await unmarkMigrationAsExecuted(migration.target, migrationName);

    logger.info(`Rolled back: ${migrationName}`);
  } catch (error) {
    logger.error("PostgreSQL rollback failed", error);
    throw error;
  } finally {
    await closeAllPgConnections();
  }
};
