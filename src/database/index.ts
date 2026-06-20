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
  getMongoConnectionNames,
  getMysqlConnectionNames,
  getPgConnectionNames,
  getRedisConnectionNames,
  getSqliteConnectionNames,
} from "../configs/index.ts";

import { configApp } from "../configs/index.ts";

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
  ] = await Promise.all([
    import("./mysql.connection.ts"),
    import("./mongo.connection.ts"),
    import("./pg.connection.ts"),
    import("./redis.connection.ts"),
    import("./sqlite.connection.ts"),
  ]);

  const tasks: Promise<void>[] = [];

  if (configApp.db.mysql) tasks.push(closeAllMysqlPools());
  if (configApp.db.mongo) tasks.push(disconnectAllMongoConnections());
  if (configApp.db.pg) tasks.push(closeAllPgConnections());
  if (configApp.db.redis) tasks.push(closeAllRedisConnections());
  if (configApp.db.sqlite) tasks.push(Promise.resolve(closeAllSqliteConnections()));

  await Promise.all(tasks);
};
