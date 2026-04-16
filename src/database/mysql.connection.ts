import mysql from "mysql2/promise";
import {
  configMysql,
  configApp,
  getMysqlConnectionNames,
  type MysqlConnectionName,
} from "../configs/index.ts";
import { logger } from "../utils/logger.util.ts";

const DEFAULT_MYSQL_CONNECTION: MysqlConnectionName = "mysql1";
const mysqlPools = new Map<MysqlConnectionName, mysql.Pool>();

const getMysqlConfig = (name: MysqlConnectionName) => {
  return configMysql()[name];
};

export const createMysqlPool = (
  name: MysqlConnectionName = DEFAULT_MYSQL_CONNECTION,
): mysql.Pool => {
  if (!configApp.db.mysql) {
    throw new Error(
      "MySQL is disabled in configuration. Enable DB_MYSQL_ENABLED=true in your .env file.",
    );
  }

  const existingPool = mysqlPools.get(name);
  if (existingPool) {
    return existingPool;
  }

  const mysqlConfig = getMysqlConfig(name);
  const pool = mysql.createPool({
    host: mysqlConfig.host,
    port: mysqlConfig.port,
    user: mysqlConfig.user,
    password: mysqlConfig.password,
    database: mysqlConfig.database,
    connectionLimit: mysqlConfig.connectionLimit,
    waitForConnections: mysqlConfig.waitForConnections,
    queueLimit: mysqlConfig.queueLimit,
  });

  mysqlPools.set(name, pool);
  logger.info(`MySQL connection pool "${name}" created`);
  return pool;
};

export const createAllMysqlPools = (): Record<MysqlConnectionName, mysql.Pool> => {
  const connectionNames = getMysqlConnectionNames();

  return Object.fromEntries(
    connectionNames.map((name) => [name, createMysqlPool(name)]),
  ) as Record<MysqlConnectionName, mysql.Pool>;
};

export const getMysqlPool = (
  name: MysqlConnectionName = DEFAULT_MYSQL_CONNECTION,
): mysql.Pool => {
  const existingPool = mysqlPools.get(name);
  if (!existingPool) {
    return createMysqlPool(name);
  }

  return existingPool;
};

export const closeMysqlPool = async (
  name: MysqlConnectionName = DEFAULT_MYSQL_CONNECTION,
): Promise<void> => {
  const pool = mysqlPools.get(name);
  if (pool) {
    await pool.end();
    mysqlPools.delete(name);
    logger.info(`MySQL connection pool "${name}" closed`);
  }
};

export const closeAllMysqlPools = async (): Promise<void> => {
  for (const name of getMysqlConnectionNames()) {
    await closeMysqlPool(name);
  }
};

export const testMysqlConnection = async (
  name: MysqlConnectionName = DEFAULT_MYSQL_CONNECTION,
): Promise<boolean> => {
  try {
    const connection = await getMysqlPool(name).getConnection();
    await connection.ping();
    connection.release();
    logger.info(`MySQL connection "${name}" test successful`);
    return true;
  } catch (error) {
    logger.error(`MySQL connection "${name}" test failed`, error);
    return false;
  }
};

export const testAllMysqlConnections = async (): Promise<boolean> => {
  for (const name of getMysqlConnectionNames()) {
    const isOk = await testMysqlConnection(name);
    if (!isOk) {
      return false;
    }
  }

  return true;
};

export type MysqlPool = mysql.Pool;
export type MysqlConnection = mysql.PoolConnection;
