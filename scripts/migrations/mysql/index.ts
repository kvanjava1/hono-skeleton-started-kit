import {
  createAllMysqlPools,
  closeAllMysqlPools,
  getMysqlPool,
} from "../../../src/database/mysql.connection.ts";
import { getMysqlConnectionNames } from "../../../src/configs/index.ts";
import {
  assertMysqlMigrationTarget,
  createMigrationsTable,
  getExecutedMigrations,
  markMigrationAsExecuted,
  unmarkMigrationAsExecuted,
} from "./runner.ts";
import { logger } from "../../../src/utils/logger.util.ts";
import * as fs from "fs";
import * as path from "path";
import type { MySqlMigration } from "./runner.ts";

const MIGRATIONS_DIR = "./scripts/migrations/mysql/files";

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

const loadMysqlMigration = async (file: string): Promise<MySqlMigration> => {
  const migrationPath = path.join(MIGRATIONS_DIR, file);
  const migration: MySqlMigration = await import(migrationPath);

  assertMysqlMigrationTarget(migration.target);
  return migration;
};

export const runMysqlMigrations = async (): Promise<void> => {
  logger.info("Running MySQL migrations...");

  try {
    createAllMysqlPools();
    for (const connectionName of getMysqlConnectionNames()) {
      await createMigrationsTable(connectionName);
    }

    const files = getMigrationFiles();
    let ranCount = 0;

    for (const file of files) {
      const migrationName = file.replace(".ts", "");
      const migration = await loadMysqlMigration(file);
      const executed = await getExecutedMigrations(migration.target);

      if (executed.includes(migrationName)) {
        logger.debug(
          `Skipping ${migrationName} for ${migration.target} (already executed)`,
        );
        continue;
      }

      logger.info(`Running migration: ${migrationName} on ${migration.target}`);

      const pool = getMysqlPool(migration.target);
      await migration.up(pool);
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
    logger.error("MySQL migrations failed", error);
    throw error;
  } finally {
    await closeAllMysqlPools();
  }
};

export const runMysqlMigrationFile = async (
  fileName: string,
): Promise<void> => {
  logger.info(`Running specific MySQL migration: ${fileName}`);

  try {
    createAllMysqlPools();
    const migrationName = fileName.replace(".ts", "");
    const migrationPath = path.join(MIGRATIONS_DIR, `${fileName}.ts`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migration = await loadMysqlMigration(`${fileName}.ts`);
    await createMigrationsTable(migration.target);
    const executed = await getExecutedMigrations(migration.target);

    if (executed.includes(migrationName)) {
      logger.info(
        `Migration ${migrationName} already executed for ${migration.target}`,
      );
      return;
    }

    const pool = getMysqlPool(migration.target);
    await migration.up(pool);
    await markMigrationAsExecuted(migration.target, migrationName);

    logger.info(`Completed: ${migrationName}`);
  } catch (error) {
    logger.error("MySQL migration failed", error);
    throw error;
  } finally {
    await closeAllMysqlPools();
  }
};

export const rollbackMysqlMigrations = async (
  steps: number = 1,
): Promise<void> => {
  logger.info(`Rolling back ${steps} MySQL migration(s)...`);

  try {
    createAllMysqlPools();
    for (const connectionName of getMysqlConnectionNames()) {
      await createMigrationsTable(connectionName);
    }

    const files = getMigrationFiles().slice().reverse();
    let rollbackCount = 0;

    for (const file of files) {
      if (rollbackCount >= steps) {
        break;
      }

      const migrationName = file.replace(".ts", "");
      const migration = await loadMysqlMigration(file);
      const executed = await getExecutedMigrations(migration.target);

      if (!executed.includes(migrationName)) {
        continue;
      }

      logger.info(`Rolling back: ${migrationName} on ${migration.target}`);
      const pool = getMysqlPool(migration.target);
      await migration.down(pool);
      await unmarkMigrationAsExecuted(migration.target, migrationName);
      logger.info(`Rolled back: ${migrationName}`);
      rollbackCount++;
    }

    if (rollbackCount === 0) {
      logger.info("No migrations to rollback");
    }
  } catch (error) {
    logger.error("MySQL rollback failed", error);
    throw error;
  } finally {
    await closeAllMysqlPools();
  }
};

export const rollbackMysqlMigrationFile = async (
  fileName: string,
): Promise<void> => {
  logger.info(`Rolling back specific MySQL migration: ${fileName}`);

  try {
    createAllMysqlPools();
    const migrationName = fileName.replace(".ts", "");
    const migrationPath = path.join(MIGRATIONS_DIR, `${fileName}.ts`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migration = await loadMysqlMigration(`${fileName}.ts`);
    await createMigrationsTable(migration.target);

    const pool = getMysqlPool(migration.target);
    await migration.down(pool);
    await unmarkMigrationAsExecuted(migration.target, migrationName);

    logger.info(`Rolled back: ${migrationName}`);
  } catch (error) {
    logger.error("MySQL rollback failed", error);
    throw error;
  } finally {
    await closeAllMysqlPools();
  }
};
