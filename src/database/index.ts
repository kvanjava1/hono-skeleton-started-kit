export {
  createMysqlPool,
  createAllMysqlPools,
  getMysqlPool,
  closeMysqlPool,
  closeAllMysqlPools,
  testMysqlConnection,
  testAllMysqlConnections,
  type MysqlPool,
  type MysqlConnection,
} from "./mysql.connection.ts";

export {
  connectMongo,
  connectAllMongoConnections,
  disconnectMongo,
  disconnectAllMongoConnections,
  testMongoConnection,
  testAllMongoConnections,
  getMongoDb,
  getMongoClient,
} from "./mongo.connection.ts";

export {
  createPgConnection,
  createAllPgConnections,
  getPgSql,
  closePgConnection,
  closeAllPgConnections,
  testPgConnection,
  testAllPgConnections,
} from "./pg.connection.ts";

export {
  createRedisConnection,
  createAllRedisConnections,
  getRedis,
  closeRedisConnection,
  closeAllRedisConnections,
  testRedisConnection,
  testAllRedisConnections,
} from "./redis.connection.ts";

export {
  createSqliteConnection,
  createAllSqliteConnections,
  getSqliteDb,
  closeSqliteConnection,
  closeAllSqliteConnections,
  testSqliteConnection,
  testAllSqliteConnections,
} from "./sqlite.connection.ts";

export {
  getDrizzleDb,
  getDrizzleSqliteDb,
  getDrizzleMysqlDb,
  getDrizzlePgDb,
  closeDrizzleDb,
  closeAllDrizzleDbs,
} from "./drizzle.ts";

export {
  getMongoConnectionNames,
  getMysqlConnectionNames,
  getPgConnectionNames,
  getRedisConnectionNames,
  getSqliteConnectionNames,
} from "../configs/index.ts";

import {
  configApp,
  getMongoConnectionNames,
  getMysqlConnectionNames,
  getPgConnectionNames,
  getRedisConnectionNames,
  getSqliteConnectionNames,
} from "../configs/index.ts";
import { withTimeout } from "../utils/async.util.ts";

export const connectAllDatabases = async (): Promise<void> => {
  const [
    { createAllMysqlPools, testAllMysqlConnections },
    { connectAllMongoConnections, testAllMongoConnections },
    { createAllPgConnections, testAllPgConnections },
    { createAllRedisConnections, testAllRedisConnections },
    { createAllSqliteConnections, testAllSqliteConnections },
  ] = await Promise.all([
    import("./mysql.connection.ts"),
    import("./mongo.connection.ts"),
    import("./pg.connection.ts"),
    import("./redis.connection.ts"),
    import("./sqlite.connection.ts"),
  ]);

  const tasks: Promise<void>[] = [];

  if (configApp.db.mysql) {
    tasks.push(
      (async () => {
        createAllMysqlPools();
        const isOk = await testAllMysqlConnections();
        if (!isOk) throw new Error("MySQL connections failed during startup");
      })(),
    );
  }

  if (configApp.db.mongo) {
    tasks.push(
      (async () => {
        await connectAllMongoConnections();
        const isOk = await testAllMongoConnections();
        if (!isOk) throw new Error("MongoDB connections failed during startup");
      })(),
    );
  }

  if (configApp.db.pg) {
    tasks.push(
      (async () => {
        createAllPgConnections();
        const isOk = await testAllPgConnections();
        if (!isOk) throw new Error("PostgreSQL connections failed during startup");
      })(),
    );
  }

  if (configApp.db.redis) {
    tasks.push(
      (async () => {
        createAllRedisConnections();
        const isOk = await testAllRedisConnections();
        if (!isOk) throw new Error("Redis connections failed during startup");
      })(),
    );
  }

  if (configApp.db.sqlite) {
    tasks.push(
      (async () => {
        await createAllSqliteConnections();
        const isOk = await testAllSqliteConnections();
        if (!isOk) throw new Error("SQLite connections failed during startup");
      })(),
    );
  }

  await Promise.all(tasks);
};

export const disconnectAllDatabases = async (): Promise<void> => {
  const [
    { closeAllMysqlPools },
    { disconnectAllMongoConnections },
    { closeAllPgConnections },
    { closeAllRedisConnections },
    { closeAllSqliteConnections },
    { closeAllDrizzleDbs },
  ] = await Promise.all([
    import("./mysql.connection.ts"),
    import("./mongo.connection.ts"),
    import("./pg.connection.ts"),
    import("./redis.connection.ts"),
    import("./sqlite.connection.ts"),
    import("./drizzle.ts"),
  ]);

  const tasks: Promise<void>[] = [];

  if (configApp.db.mysql) tasks.push(closeAllMysqlPools());
  if (configApp.db.mongo) tasks.push(disconnectAllMongoConnections());
  if (configApp.db.pg) tasks.push(closeAllPgConnections());
  if (configApp.db.redis) tasks.push(closeAllRedisConnections());
  if (configApp.db.sqlite) tasks.push(Promise.resolve(closeAllSqliteConnections()));
  closeAllDrizzleDbs();

  await Promise.all(tasks);
};

export interface ReadinessCheck {
  name: string;
  status: "up" | "down";
  latencyMs: number;
  error?: string;
}

const READINESS_TIMEOUT_MS = 2000;

const runReadinessCheck = async (
  name: string,
  test: () => Promise<boolean>,
): Promise<ReadinessCheck> => {
  const start = Date.now();

  try {
    const isUp = await withTimeout(test(), READINESS_TIMEOUT_MS);
    if (!isUp) throw new Error("connection test failed");
    return { name, status: "up", latencyMs: Date.now() - start };
  } catch (error) {
    return {
      name,
      status: "down",
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const checkDatabaseReadiness = async (): Promise<ReadinessCheck[]> => {
  const checks: Promise<ReadinessCheck>[] = [];

  if (configApp.db.mysql) {
    const { testMysqlConnection } = await import("./mysql.connection.ts");
    for (const name of getMysqlConnectionNames()) {
      checks.push(runReadinessCheck(name, () => testMysqlConnection(name)));
    }
  }

  if (configApp.db.mongo) {
    const { testMongoConnection } = await import("./mongo.connection.ts");
    for (const name of getMongoConnectionNames()) {
      checks.push(runReadinessCheck(name, () => testMongoConnection(name)));
    }
  }

  if (configApp.db.pg) {
    const { testPgConnection } = await import("./pg.connection.ts");
    for (const name of getPgConnectionNames()) {
      checks.push(runReadinessCheck(name, () => testPgConnection(name)));
    }
  }

  if (configApp.db.redis) {
    const { testRedisConnection } = await import("./redis.connection.ts");
    for (const name of getRedisConnectionNames()) {
      checks.push(runReadinessCheck(name, () => testRedisConnection(name)));
    }
  }

  if (configApp.db.sqlite) {
    const { testSqliteConnection } = await import("./sqlite.connection.ts");
    for (const name of getSqliteConnectionNames()) {
      checks.push(runReadinessCheck(name, () => testSqliteConnection(name)));
    }
  }

  return Promise.all(checks);
};
