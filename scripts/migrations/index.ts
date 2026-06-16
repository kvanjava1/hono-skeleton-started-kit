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

export const runAllMigrations = async (): Promise<void> => {
  console.log("Running all migrations...\n");

  const results = await Promise.all([
    tryRun({ label: "MySQL migrations", run: runMysqlMigrations }),
    tryRun({ label: "MongoDB migrations", run: runMongoMigrations }),
    tryRun({ label: "PostgreSQL migrations", run: runPgMigrations }),
    tryRun({ label: "SQLite migrations", run: runSqliteMigrations }),
  ]);

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

  const results = await Promise.all([
    tryRun({
      label: "MySQL rollback",
      run: () => rollbackMysqlMigrations(steps),
    }),
    tryRun({
      label: "MongoDB rollback",
      run: () => rollbackMongoMigrations(steps),
    }),
    tryRun({
      label: "PostgreSQL rollback",
      run: () => rollbackPgMigrations(steps),
    }),
    tryRun({
      label: "SQLite rollback",
      run: () => rollbackSqliteMigrations(steps),
    }),
  ]);

  const hasFailures = results.some((ok) => !ok);
  if (hasFailures) {
    console.error("Some rollbacks failed. Check the logs above.");
    process.exit(1);
  }

  console.log("All rollbacks complete!");
};
