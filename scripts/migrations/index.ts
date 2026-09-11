export {
  runMysqlMigrations,
  runMysqlMigrationFile,
  rollbackMysqlMigrations,
  rollbackMysqlMigrationFile,
} from "./mysql/index.ts";

export {
  runMongoMigrations,
  runMongoMigrationFile,
  rollbackMongoMigrations,
  rollbackMongoMigrationFile,
} from "./mongo/index.ts";

export {
  runSqliteMigrations,
  runSqliteMigrationFile,
  rollbackSqliteMigrations,
  rollbackSqliteMigrationFile,
} from "./sqlite/index.ts";

export {
  runPgMigrations,
  runPgMigrationFile,
  rollbackPgMigrations,
  rollbackPgMigrationFile,
} from "./pg/index.ts";

export { createMigrationFile } from "./utils.ts";

import { runMysqlMigrations, rollbackMysqlMigrations } from "./mysql/index.ts";
import { runMongoMigrations, rollbackMongoMigrations } from "./mongo/index.ts";
import {
  runSqliteMigrations,
  rollbackSqliteMigrations,
} from "./sqlite/index.ts";
import { runPgMigrations, rollbackPgMigrations } from "./pg/index.ts";
import { configApp } from "../../src/configs/index.ts";

interface RunOptions {
  label: string;
  run: () => Promise<void>;
}

const tryRun = async (options: RunOptions): Promise<boolean> => {
  try {
    await options.run();
    console.log("");
    return true;
  } catch (error) {
    console.error(`${options.label} failed:`, error);
    return false;
  }
};

const getEnabledMigrations = (): RunOptions[] => {
  const jobs: RunOptions[] = [];
  if (configApp.db.mysql) {
    jobs.push({ label: "MySQL migrations", run: runMysqlMigrations });
  }
  if (configApp.db.mongo) {
    jobs.push({ label: "MongoDB migrations", run: runMongoMigrations });
  }
  if (configApp.db.pg) {
    jobs.push({ label: "PostgreSQL migrations", run: runPgMigrations });
  }
  if (configApp.db.sqlite) {
    jobs.push({ label: "SQLite migrations", run: runSqliteMigrations });
  }
  return jobs;
};

const getEnabledRollbacks = (steps: number): RunOptions[] => {
  const jobs: RunOptions[] = [];
  if (configApp.db.mysql) {
    jobs.push({
      label: "MySQL rollback",
      run: () => rollbackMysqlMigrations(steps),
    });
  }
  if (configApp.db.mongo) {
    jobs.push({
      label: "MongoDB rollback",
      run: () => rollbackMongoMigrations(steps),
    });
  }
  if (configApp.db.pg) {
    jobs.push({
      label: "PostgreSQL rollback",
      run: () => rollbackPgMigrations(steps),
    });
  }
  if (configApp.db.sqlite) {
    jobs.push({
      label: "SQLite rollback",
      run: () => rollbackSqliteMigrations(steps),
    });
  }
  return jobs;
};

export const runAllMigrations = async (): Promise<void> => {
  console.log("Running all migrations...\n");

  const jobs = getEnabledMigrations();
  if (jobs.length === 0) {
    console.log("No databases are enabled. Nothing to migrate.");
    return;
  }

  const results = await Promise.all(jobs.map((job) => tryRun(job)));

  const hasFailures = results.some((ok) => !ok);
  if (hasFailures) {
    console.error("Some migrations failed. Check the logs above.");
    process.exit(1);
  }

  console.log("All migrations complete!");
};

export const rollbackAllMigrations = async (
  steps: number = 1,
): Promise<void> => {
  console.log(`Rolling back ${steps} migration(s) for all databases...\n`);

  const jobs = getEnabledRollbacks(steps);
  if (jobs.length === 0) {
    console.log("No databases are enabled. Nothing to roll back.");
    return;
  }

  const results = await Promise.all(jobs.map((job) => tryRun(job)));

  const hasFailures = results.some((ok) => !ok);
  if (hasFailures) {
    console.error("Some rollbacks failed. Check the logs above.");
    process.exit(1);
  }

  console.log("All rollbacks complete!");
};
