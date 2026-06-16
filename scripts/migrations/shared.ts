import * as fs from "fs";
import * as path from "path";
import { logger } from "../../src/utils/logger.util.ts";

export const getMigrationFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created migrations directory: ${dir}`);
  }
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".ts"))
    .sort();
};

export interface MigrationEngine<TConn> {
  name: string;
  migrationsDir: string;
  getConnectionNames: () => string[];
  createAllConnections: () => Promise<void>;
  closeAllConnections: () => Promise<void>;
  getConnection: (name: string) => TConn | Promise<TConn>;
  createMigrationsTable: (connectionName: string) => Promise<void>;
  getExecutedMigrations: (connectionName: string) => Promise<string[]>;
  markMigrationAsExecuted: (connectionName: string, name: string) => Promise<void>;
  unmarkMigrationAsExecuted: (connectionName: string, name: string) => Promise<void>;
  loadMigration: (file: string) => Promise<{
    name: string;
    target: string;
    up: (conn: TConn) => Promise<void>;
    down: (conn: TConn) => Promise<void>;
  }>;
}

export const createMigrationRunner = <TConn>(engine: MigrationEngine<TConn>) => {
  const {
    name, migrationsDir, getConnectionNames,
    createAllConnections, closeAllConnections, getConnection,
    createMigrationsTable, getExecutedMigrations,
    markMigrationAsExecuted, unmarkMigrationAsExecuted,
    loadMigration,
  } = engine;

  const withConnections = async <T>(fn: () => Promise<T>): Promise<T> => {
    await createAllConnections();
    try {
      return await fn();
    } finally {
      await closeAllConnections();
    }
  };

  const initTables = async (): Promise<void> => {
    for (const connectionName of getConnectionNames()) {
      await createMigrationsTable(connectionName);
    }
  };

  const run = async (): Promise<void> => {
    logger.info(`Running ${name} migrations...`);
    try {
      await withConnections(async () => {
        await initTables();
        const files = getMigrationFiles(migrationsDir);
        let ranCount = 0;

        for (const file of files) {
          const migrationName = file.replace(".ts", "");
          const migration = await loadMigration(file);
          const executed = await getExecutedMigrations(migration.target);

          if (executed.includes(migrationName)) {
            logger.debug(`Skipping ${migrationName} for ${migration.target} (already executed)`);
            continue;
          }

          logger.info(`Running migration: ${migrationName} on ${migration.target}`);
          const conn = await getConnection(migration.target);
          await migration.up(conn);
          await markMigrationAsExecuted(migration.target, migrationName);
          logger.info(`Completed: ${migrationName}`);
          ranCount++;
        }

        if (ranCount === 0) {
          logger.info("No new migrations to run");
        } else {
          logger.info(`Ran ${ranCount} migration(s)`);
        }
      });
    } catch (error) {
      logger.error(`${name} migrations failed`, error);
      throw error;
    }
  };

  const runFile = async (fileName: string): Promise<void> => {
    logger.info(`Running specific ${name} migration: ${fileName}`);
    try {
      await withConnections(async () => {
        const migrationName = fileName.replace(".ts", "");
        const filePath = path.join(migrationsDir, `${fileName}.ts`);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Migration file not found: ${filePath}`);
        }
        const migration = await loadMigration(`${fileName}.ts`);
        await createMigrationsTable(migration.target);
        const executed = await getExecutedMigrations(migration.target);
        if (executed.includes(migrationName)) {
          logger.info(`Migration ${migrationName} already executed for ${migration.target}`);
          return;
        }
        const conn = await getConnection(migration.target);
        await migration.up(conn);
        await markMigrationAsExecuted(migration.target, migrationName);
        logger.info(`Completed: ${migrationName}`);
      });
    } catch (error) {
      logger.error(`${name} migration failed`, error);
      throw error;
    }
  };

  const rollback = async (steps: number = 1): Promise<void> => {
    logger.info(`Rolling back ${steps} ${name} migration(s)...`);
    try {
      await withConnections(async () => {
        await initTables();
        const files = getMigrationFiles(migrationsDir).slice().reverse();
        let rollbackCount = 0;

        for (const file of files) {
          if (rollbackCount >= steps) break;
          const migrationName = file.replace(".ts", "");
          const migration = await loadMigration(file);
          const executed = await getExecutedMigrations(migration.target);
          if (!executed.includes(migrationName)) continue;

          logger.info(`Rolling back: ${migrationName} on ${migration.target}`);
          const conn = await getConnection(migration.target);
          await migration.down(conn);
          await unmarkMigrationAsExecuted(migration.target, migrationName);
          logger.info(`Rolled back: ${migrationName}`);
          rollbackCount++;
        }

        if (rollbackCount === 0) {
          logger.info("No migrations to rollback");
        }
      });
    } catch (error) {
      logger.error(`${name} rollback failed`, error);
      throw error;
    }
  };

  const rollbackFile = async (fileName: string): Promise<void> => {
    logger.info(`Rolling back specific ${name} migration: ${fileName}`);
    try {
      await withConnections(async () => {
        const migrationName = fileName.replace(".ts", "");
        const filePath = path.join(migrationsDir, `${fileName}.ts`);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Migration file not found: ${filePath}`);
        }
        const migration = await loadMigration(`${fileName}.ts`);
        await createMigrationsTable(migration.target);
        const conn = await getConnection(migration.target);
        await migration.down(conn);
        await unmarkMigrationAsExecuted(migration.target, migrationName);
        logger.info(`Rolled back: ${migrationName}`);
      });
    } catch (error) {
      logger.error(`${name} rollback failed`, error);
      throw error;
    }
  };

  return { run, runFile, rollback, rollbackFile };
};
