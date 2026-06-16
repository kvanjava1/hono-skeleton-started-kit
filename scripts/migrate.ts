import {
  runAllMigrations,
  rollbackAllMigrations,
  runMysqlMigrations,
  runMongoMigrations,
  runSqliteMigrations,
  runPgMigrations,
  rollbackMysqlMigrations,
  rollbackMongoMigrations,
  rollbackSqliteMigrations,
  rollbackPgMigrations,
  runMysqlMigrationFile,
  runMongoMigrationFile,
  runSqliteMigrationFile,
  runPgMigrationFile,
  rollbackMysqlMigrationFile,
  rollbackMongoMigrationFile,
  rollbackSqliteMigrationFile,
  rollbackPgMigrationFile,
  createMigrationFile,
} from "./migrations/index.ts";
const args = process.argv.slice(2);
const knownCommands = ["up", "down", "create", "status", "rollback", "fresh", "help"];
const targets = ["mysql", "mongo", "pg", "sqlite", "all"];

let command = "up";
let target = "all";
let fileName: string | undefined = undefined;

if (args.length > 0) {
  const arg0 = args[0]!;
  if (knownCommands.includes(arg0)) {
    command = arg0;
    target = args[1] || "all";
    fileName = args[2];
  } else if (targets.includes(arg0)) {
    command = "up";
    target = arg0;
    fileName = args[1];
  } else {
    command = "help";
  }
}

const steps = fileName && !Number.isNaN(Number.parseInt(fileName, 10))
  ? Number.parseInt(fileName, 10)
  : 1;

const printUsage = () => {
  console.log(`
Migration CLI (Laravel-style)

Usage:
  bun run migrate [command] [target] [options]

Commands:
  up [target]              Run all pending migrations (Default)
  down [target] [steps]    Rollback migrations (default: 1 step)
  fresh [target]           Drop all tables & re-run migrations (sqlite, mysql, pg, mongo)
  create <target> <name>   Create a new migration file (target: mysql, mongo, pg, sqlite)
  status [target]          Show migration status
  rollback [target]        Alias for 'down'

Note: You can also run a specific file directly:
  bun run migrate <target> <file_name>

Targets:
  all (default), mysql, mongo, pg, sqlite

Examples:
  bun run migrate                        Run all pending migrations
  bun run migrate mysql                  Run MySQL migrations only
  bun run migrate down                   Rollback 1 step for all DBs
  bun run migrate pg <file_name>         Run specific PG migration
  bun run migrate create pg add_users_table
`);
};

const run = async () => {
  if (command === "rollback") command = "down";

  switch (command) {
    case "up":
      if (
        ["mysql", "mongo", "pg", "sqlite"].includes(target) &&
        fileName &&
        Number.isNaN(Number.parseInt(fileName, 10))
      ) {
        console.log(`Running specific migration file: ${fileName}`);
        if (target === "mysql") await runMysqlMigrationFile(fileName);
        if (target === "mongo") await runMongoMigrationFile(fileName);
        if (target === "pg") await runPgMigrationFile(fileName);
        if (target === "sqlite") await runSqliteMigrationFile(fileName);
        break;
      }

      if (target === "mysql") {
        await runMysqlMigrations();
      } else if (target === "mongo") {
        await runMongoMigrations();
      } else if (target === "pg") {
        await runPgMigrations();
      } else if (target === "sqlite") {
        await runSqliteMigrations();
      } else {
        await runAllMigrations();
      }
      break;

    case "down":
      if (target === "mysql") {
        await rollbackMysqlMigrations(steps);
      } else if (target === "mongo") {
        await rollbackMongoMigrations(steps);
      } else if (target === "pg") {
        await rollbackPgMigrations(steps);
      } else if (target === "sqlite") {
        await rollbackSqliteMigrations(steps);
      } else {
        await rollbackAllMigrations(steps);
      }
      break;

    case "create":
      if (target === "all" || !fileName) {
        console.error("Error: target and name are required");
        printUsage();
        process.exit(1);
      }
      if (!["mysql", "mongo", "pg", "sqlite"].includes(target)) {
        console.error("Error: target must be mysql, mongo, pg, or sqlite");
        process.exit(1);
      }
      const filePath = createMigrationFile(target as "mysql" | "mongo" | "pg" | "sqlite", fileName);
      console.log(`Created migration: ${filePath}`);
      break;

    case "fresh":
      if (target === "all") {
        console.error("Error: pick one target (mysql, mongo, pg, sqlite)");
        process.exit(1);
      }

      if (target === "sqlite") {
        const { getSqliteDb, closeSqliteConnection } = await import("../src/database/sqlite.connection.ts");
        const { getSqliteConnectionNames } = await import("../src/configs/index.ts");

        for (const connName of getSqliteConnectionNames()) {
          const db = await getSqliteDb(connName);
          const tables = db
            .query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('migrations', 'sqlite_sequence')")
            .all();
          for (const t of tables) {
            db.run(`DROP TABLE IF EXISTS "${t.name}"`);
            console.log(`  Dropped table: ${t.name}`);
          }
          db.run("DELETE FROM migrations");
          closeSqliteConnection(connName);
        }

        await runSqliteMigrations();
      } else if (target === "mysql") {
        const { getMysqlConnectionNames } = await import("../src/configs/index.ts");

        for (const connName of getMysqlConnectionNames()) {
          const { getMysqlPool, closeMysqlPool } = await import("../src/database/mysql.connection.ts");
          const pool = getMysqlPool(connName);

          await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
          const [rows] = await pool.execute(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME != 'migrations'",
          );
          for (const row of rows as { TABLE_NAME: string }[]) {
            await pool.execute(`DROP TABLE IF EXISTS \`${row.TABLE_NAME}\``);
            console.log(`  Dropped table: ${row.TABLE_NAME}`);
          }
          await pool.execute("DELETE FROM migrations");
          await pool.execute("SET FOREIGN_KEY_CHECKS = 1");
          closeMysqlPool(connName);
        }

        await runMysqlMigrations();
      } else if (target === "pg") {
        const { getPgConnectionNames } = await import("../src/configs/index.ts");

        for (const connName of getPgConnectionNames()) {
          const { getPgSql, closePgConnection } = await import("../src/database/pg.connection.ts");
          const sql = getPgSql(connName);

          const rows = await sql<{ tablename: string }[]>`
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public' AND tablename != 'migrations'
          `;
          for (const row of rows) {
            await sql.unsafe(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`);
            console.log(`  Dropped table: ${row.tablename}`);
          }
          await sql`DELETE FROM migrations`;
          closePgConnection(connName);
        }

        await runPgMigrations();
      } else if (target === "mongo") {
        const { getMongoConnectionNames } = await import("../src/configs/index.ts");

        for (const connName of getMongoConnectionNames()) {
          const { getMongoDb, getMongoClient } = await import("../src/database/mongo.connection.ts");
          const db = getMongoDb(connName);

          const collections = await db.listCollections().toArray();
          for (const col of collections) {
            if (col.name === "migrations") continue;
            await db.dropCollection(col.name);
            console.log(`  Dropped collection: ${col.name}`);
          }
          await db.collection("migrations").deleteMany({});
        }

        await runMongoMigrations();
      } else {
        console.log(`Fresh migration not yet supported for ${target}`);
        process.exit(1);
      }
      break;

    case "status":
      console.log("Status command coming soon...");
      break;

    case "help":
      printUsage();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
};

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
