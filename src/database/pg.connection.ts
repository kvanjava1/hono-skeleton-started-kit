import postgres from "postgres";
import {
  configPg,
  configApp,
  getPgConnectionNames,
  type PgConnectionName,
} from "../configs/index.ts";
import { logger } from "../utils/logger.util.ts";

const DEFAULT_PG_CONNECTION: PgConnectionName = "pg1";
const pgConnections = new Map<PgConnectionName, postgres.Sql>();

const getPgConfig = (name: PgConnectionName) => {
  return configPg()[name];
};

export const createPgConnection = (
  name: PgConnectionName = DEFAULT_PG_CONNECTION,
) => {
  if (!configApp.db.pg) {
    throw new Error(
      "PostgreSQL is disabled in configuration. Enable DB_PG_ENABLED=true in your .env file.",
    );
  }

  const existingConnection = pgConnections.get(name);
  if (existingConnection) {
    return existingConnection;
  }

  try {
    const pgConfig = getPgConfig(name);
    const sql = postgres({
      host: pgConfig.host,
      port: pgConfig.port,
      user: pgConfig.user,
      password: pgConfig.password,
      database: pgConfig.database,
    });

    pgConnections.set(name, sql);
    logger.info(`PostgreSQL connection "${name}" connected to ${pgConfig.database}`);
    return sql;
  } catch (error) {
    logger.error(`PostgreSQL connection "${name}" failed`, error);
    throw error;
  }
};

export const createAllPgConnections = (): Record<
  PgConnectionName,
  postgres.Sql
> => {
  const connectionNames = getPgConnectionNames();

  return Object.fromEntries(
    connectionNames.map((name) => [name, createPgConnection(name)]),
  ) as Record<PgConnectionName, postgres.Sql>;
};

export const getPgSql = (
  name: PgConnectionName = DEFAULT_PG_CONNECTION,
) => {
  const existingConnection = pgConnections.get(name);
  if (!existingConnection) {
    return createPgConnection(name);
  }

  return existingConnection;
};

export const closePgConnection = async (
  name: PgConnectionName = DEFAULT_PG_CONNECTION,
) => {
  const sql = pgConnections.get(name);
  if (sql) {
    await sql.end();
    pgConnections.delete(name);
    logger.info(`PostgreSQL connection "${name}" closed`);
  }
};

export const closeAllPgConnections = async (): Promise<void> => {
  for (const name of getPgConnectionNames()) {
    await closePgConnection(name);
  }
};

export const testPgConnection = async (
  name: PgConnectionName = DEFAULT_PG_CONNECTION,
) => {
  try {
    const pgSql = getPgSql(name);
    await pgSql`SELECT 1`;
    logger.info(`PostgreSQL connection "${name}" test successful`);
    return true;
  } catch (error) {
    logger.error(`PostgreSQL connection "${name}" test failed`, error);
    return false;
  }
};

export const testAllPgConnections = async (): Promise<boolean> => {
  for (const name of getPgConnectionNames()) {
    const isOk = await testPgConnection(name);
    if (!isOk) {
      return false;
    }
  }

  return true;
};
