const MYSQL_CONNECTION_DEFAULTS = {
  mysql1: {
    envKeys: {
      host: "MYSQL_HOST_1",
      port: "MYSQL_PORT_1",
      user: "MYSQL_USER_1",
      password: "MYSQL_PASSWORD_1",
      database: "MYSQL_DATABASE_1",
    },
    legacyEnvKeys: {
      host: "MYSQL_HOST",
      port: "MYSQL_PORT",
      user: "MYSQL_USER",
      password: "MYSQL_PASSWORD",
      database: "MYSQL_DATABASE",
    },
    defaults: {
      host: "localhost",
      port: 3306,
      user: "root",
      password: "",
      database: "myapp",
    },
  },
} as const;

type MysqlConnectionDefinition =
  (typeof MYSQL_CONNECTION_DEFAULTS)[keyof typeof MYSQL_CONNECTION_DEFAULTS];

import { getStringValue, getNumberValue } from "./env.ts";

const buildConnectionConfig = (
  definition: MysqlConnectionDefinition,
  env: Record<string, string | undefined>,
) => {
  return {
    host: getStringValue(
      env,
      definition.envKeys.host,
      definition.defaults.host,
      definition.legacyEnvKeys?.host,
    ),
    port: getNumberValue(
      env,
      definition.envKeys.port,
      definition.defaults.port,
      definition.legacyEnvKeys?.port,
    ),
    user: getStringValue(
      env,
      definition.envKeys.user,
      definition.defaults.user,
      definition.legacyEnvKeys?.user,
    ),
    password: getStringValue(
      env,
      definition.envKeys.password,
      definition.defaults.password,
      definition.legacyEnvKeys?.password,
    ),
    database: getStringValue(
      env,
      definition.envKeys.database,
      definition.defaults.database,
      definition.legacyEnvKeys?.database,
    ),
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
  };
};

export interface MysqlConnectionConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  waitForConnections: boolean;
  queueLimit: number;
}

export interface MysqlConfig {
  mysql1: MysqlConnectionConfig;
}

export const buildMysqlConfig = (
  env: Record<string, string | undefined> = process.env,
): MysqlConfig => {
  return Object.fromEntries(
    Object.entries(MYSQL_CONNECTION_DEFAULTS).map(([name, definition]) => [
      name,
      buildConnectionConfig(definition, env),
    ]),
  ) as unknown as MysqlConfig;
};

let cachedMysqlConfig: MysqlConfig | null = null;

export const configMysql = (): MysqlConfig => {
  if (!cachedMysqlConfig) {
    cachedMysqlConfig = buildMysqlConfig(process.env);
  }
  return cachedMysqlConfig;
};

export type ConfigMysql = MysqlConfig;
export type MysqlConnectionName = keyof MysqlConfig;

export const resetConfigMysql = (): void => {
  cachedMysqlConfig = null;
};

export const getMysqlConnectionNames = (): MysqlConnectionName[] => {
  return Object.keys(configMysql()) as MysqlConnectionName[];
};
