import { createMigrationRunner } from "../shared.ts";
import {
  connectAllMongoConnections,
  disconnectAllMongoConnections,
  getMongoDb,
} from "../../../src/database/mongo.connection.ts";
import { getMongoConnectionNames } from "../../../src/configs/index.ts";
import {
  getExecutedMigrations,
  markMigrationAsExecuted,
  unmarkMigrationAsExecuted,
} from "./runner.ts";
import type { MongoConnectionName } from "../../../src/configs/index.ts";
import type { MongoMigration } from "./runner.ts";
import * as path from "path";

const MIGRATIONS_DIR = "./scripts/migrations/mongo/files";

export const mongoRunner = createMigrationRunner({
  name: "MongoDB",
  migrationsDir: MIGRATIONS_DIR,
  getConnectionNames: getMongoConnectionNames as () => string[],
  createAllConnections: async () => { await connectAllMongoConnections(); },
  closeAllConnections: async () => { await disconnectAllMongoConnections(); },
  getConnection: (name: string) => getMongoDb(name as MongoConnectionName),
  createMigrationsTable: async () => {},
  getExecutedMigrations: (name: string) =>
    getExecutedMigrations(name as MongoConnectionName),
  markMigrationAsExecuted: (name: string, migrationName: string) =>
    markMigrationAsExecuted(name as MongoConnectionName, migrationName),
  unmarkMigrationAsExecuted: (name: string, migrationName: string) =>
    unmarkMigrationAsExecuted(name as MongoConnectionName, migrationName),
  loadMigration: async (file: string) => {
    const migration: MongoMigration = await import(path.resolve(MIGRATIONS_DIR, file));
    if (!getMongoConnectionNames().includes(migration.target as MongoConnectionName)) {
      throw new Error(`MongoDB migration target "${migration.target}" is invalid.`);
    }
    return migration;
  },
});

export const runMongoMigrations = mongoRunner.run;
export const runMongoMigrationFile = mongoRunner.runFile;
export const rollbackMongoMigrations = mongoRunner.rollback;
export const rollbackMongoMigrationFile = mongoRunner.rollbackFile;
