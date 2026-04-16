import {
  connectAllMongoConnections,
  connectMongo,
  disconnectAllMongoConnections,
  getMongoDb,
} from "../../../src/database/mongo.connection.ts";
import {
  assertMongoMigrationTarget,
  getExecutedMigrations,
  markMigrationAsExecuted,
  unmarkMigrationAsExecuted,
} from "./runner.ts";
import { logger } from "../../../src/utils/logger.util.ts";
import * as fs from "fs";
import * as path from "path";
import type { MongoMigration } from "./runner.ts";

const MIGRATIONS_DIR = "./scripts/migrations/mongo/files";

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

const loadMongoMigration = async (file: string): Promise<MongoMigration> => {
  const migrationPath = path.join(MIGRATIONS_DIR, file);
  const migration: MongoMigration = await import(migrationPath);

  assertMongoMigrationTarget(migration.target);
  return migration;
};

export const runMongoMigrations = async (): Promise<void> => {
  logger.info("Running MongoDB migrations...");

  try {
    await connectAllMongoConnections();
    const files = getMigrationFiles();
    let ranCount = 0;

    for (const file of files) {
      const migrationName = file.replace(".ts", "");
      const migration = await loadMongoMigration(file);
      const executed = await getExecutedMigrations(migration.target);

      if (executed.includes(migrationName)) {
        logger.debug(
          `Skipping ${migrationName} for ${migration.target} (already executed)`,
        );
        continue;
      }

      logger.info(`Running migration: ${migrationName} on ${migration.target}`);
      const db = getMongoDb(migration.target);
      await migration.up(db);
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
    logger.error("MongoDB migrations failed", error);
    throw error;
  } finally {
    await disconnectAllMongoConnections();
  }
};

export const runMongoMigrationFile = async (
  fileName: string,
): Promise<void> => {
  logger.info(`Running specific MongoDB migration: ${fileName}`);

  try {
    const migrationName = fileName.replace(".ts", "");
    const migrationPath = path.join(MIGRATIONS_DIR, `${fileName}.ts`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migration = await loadMongoMigration(`${fileName}.ts`);
    await connectMongo(migration.target);
    const executed = await getExecutedMigrations(migration.target);

    if (executed.includes(migrationName)) {
      logger.info(
        `Migration ${migrationName} already executed for ${migration.target}`,
      );
      return;
    }

    const db = getMongoDb(migration.target);
    await migration.up(db);
    await markMigrationAsExecuted(migration.target, migrationName);

    logger.info(`Completed: ${migrationName}`);
  } catch (error) {
    logger.error("MongoDB migration failed", error);
    throw error;
  } finally {
    await disconnectAllMongoConnections();
  }
};

export const rollbackMongoMigrations = async (
  steps: number = 1,
): Promise<void> => {
  logger.info(`Rolling back ${steps} MongoDB migration(s)...`);

  try {
    await connectAllMongoConnections();
    const files = getMigrationFiles().slice().reverse();
    let rollbackCount = 0;

    for (const file of files) {
      if (rollbackCount >= steps) {
        break;
      }

      const migrationName = file.replace(".ts", "");
      const migration = await loadMongoMigration(file);
      const executed = await getExecutedMigrations(migration.target);

      if (!executed.includes(migrationName)) {
        continue;
      }

      logger.info(`Rolling back: ${migrationName} on ${migration.target}`);
      const db = getMongoDb(migration.target);
      await migration.down(db);
      await unmarkMigrationAsExecuted(migration.target, migrationName);

      logger.info(`Rolled back: ${migrationName}`);
      rollbackCount++;
    }

    if (rollbackCount === 0) {
      logger.info("No migrations to rollback");
    }
  } catch (error) {
    logger.error("MongoDB rollback failed", error);
    throw error;
  } finally {
    await disconnectAllMongoConnections();
  }
};

export const rollbackMongoMigrationFile = async (
  fileName: string,
): Promise<void> => {
  logger.info(`Rolling back specific MongoDB migration: ${fileName}`);

  try {
    const migrationName = fileName.replace(".ts", "");
    const migrationPath = path.join(MIGRATIONS_DIR, `${fileName}.ts`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migration = await loadMongoMigration(`${fileName}.ts`);
    await connectMongo(migration.target);
    const db = getMongoDb(migration.target);

    await migration.down(db);
    await unmarkMigrationAsExecuted(migration.target, migrationName);

    logger.info(`Rolled back: ${migrationName}`);
  } catch (error) {
    logger.error("MongoDB rollback failed", error);
    throw error;
  } finally {
    await disconnectAllMongoConnections();
  }
};
