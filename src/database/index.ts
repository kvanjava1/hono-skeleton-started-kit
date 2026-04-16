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
  type SqliteConnectionName,
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
  const { createAllMysqlPools, testAllMysqlConnections } =
    await import("./mysql.connection.ts");
  const { connectAllMongoConnections, testAllMongoConnections } =
    await import("./mongo.connection.ts");
  const { createAllPgConnections, testAllPgConnections } =
    await import("./pg.connection.ts");
  const { createAllRedisConnections, testAllRedisConnections } =
    await import("./redis.connection.ts");
  const { createAllSqliteConnections, testAllSqliteConnections } =
    await import("./sqlite.connection.ts");

  if (configApp.db.mysql) {
    createAllMysqlPools();
    const isOk = await testAllMysqlConnections();
    if (!isOk) throw new Error("MySQL connections failed during startup");
  }

  if (configApp.db.mongo) {
    await connectAllMongoConnections();
    const isOk = await testAllMongoConnections();
    if (!isOk) throw new Error("MongoDB connections failed during startup");
  }

  if (configApp.db.pg) {
    createAllPgConnections();
    const isOk = await testAllPgConnections();
    if (!isOk) throw new Error("PostgreSQL connections failed during startup");
  }

  if (configApp.db.redis) {
    createAllRedisConnections();
    const isOk = await testAllRedisConnections();
    if (!isOk) throw new Error("Redis connections failed during startup");
  }

  if (configApp.db.sqlite) {
    createAllSqliteConnections();
    const isOk = testAllSqliteConnections();
    if (!isOk) throw new Error("SQLite connections failed during startup");
  }
};

export const disconnectAllDatabases = async (): Promise<void> => {
  const { closeAllMysqlPools } = await import("./mysql.connection.ts");
  const { disconnectAllMongoConnections } =
    await import("./mongo.connection.ts");
  const { closeAllPgConnections } = await import("./pg.connection.ts");
  const { closeAllRedisConnections } = await import("./redis.connection.ts");
  const { closeAllSqliteConnections } = await import("./sqlite.connection.ts");

  if (configApp.db.mysql) await closeAllMysqlPools();
  if (configApp.db.mongo) await disconnectAllMongoConnections();
  if (configApp.db.pg) await closeAllPgConnections();
  if (configApp.db.redis) await closeAllRedisConnections();
  if (configApp.db.sqlite) closeAllSqliteConnections();
};
