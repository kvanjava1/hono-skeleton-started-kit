const PG_CONNECTION_DEFAULTS = {
  pg1: {
    envKeys: {
      host: "PG_HOST_1",
      port: "PG_PORT_1",
      user: "PG_USER_1",
      password: "PG_PASSWORD_1",
      database: "PG_DATABASE_1",
      maxConnections: "PG_MAX_CONNECTIONS_1",
      idleTimeout: "PG_IDLE_TIMEOUT_1",
      connectTimeout: "PG_CONNECT_TIMEOUT_1",
    },
    legacyEnvKeys: {
      host: "PG_HOST",
      port: "PG_PORT",
      user: "PG_USER",
      password: "PG_PASSWORD",
      database: "PG_DATABASE",
      maxConnections: "PG_MAX_CONNECTIONS",
      idleTimeout: "PG_IDLE_TIMEOUT",
      connectTimeout: "PG_CONNECT_TIMEOUT",
    },
    defaults: {
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: "",
      database: "myapp",
      maxConnections: 10,
      idleTimeout: 30,
      connectTimeout: 30,
    },
  },
} as const;

type PgConnectionDefinition =
  (typeof PG_CONNECTION_DEFAULTS)[keyof typeof PG_CONNECTION_DEFAULTS];

import { getStringValue, getNumberValue } from "./env.ts";

const buildConnectionConfig = (
  definition: PgConnectionDefinition,
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
    maxConnections: getNumberValue(
      env,
      definition.envKeys.maxConnections,
      definition.defaults.maxConnections,
      definition.legacyEnvKeys?.maxConnections,
    ),
    idleTimeout: getNumberValue(
      env,
      definition.envKeys.idleTimeout,
      definition.defaults.idleTimeout,
      definition.legacyEnvKeys?.idleTimeout,
    ),
    connectTimeout: getNumberValue(
      env,
      definition.envKeys.connectTimeout,
      definition.defaults.connectTimeout,
      definition.legacyEnvKeys?.connectTimeout,
    ),
  };
};

export interface PgConnectionConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  maxConnections: number;
  idleTimeout: number;
  connectTimeout: number;
}

export interface PgConfig {
  pg1: PgConnectionConfig;
}

export const buildPgConfig = (
  env: Record<string, string | undefined> = process.env,
): PgConfig => {
  return Object.fromEntries(
    Object.entries(PG_CONNECTION_DEFAULTS).map(([name, definition]) => [
      name,
      buildConnectionConfig(definition, env),
    ]),
  ) as unknown as PgConfig;
};

let cachedPgConfig: PgConfig | null = null;

export const configPg = (): PgConfig => {
  if (!cachedPgConfig) {
    cachedPgConfig = buildPgConfig(process.env);
  }
  return cachedPgConfig;
};

export type ConfigPg = PgConfig;
export type PgConnectionName = keyof PgConfig;

export const resetConfigPg = (): void => {
  cachedPgConfig = null;
};

export const getPgConnectionNames = (): PgConnectionName[] => {
  return Object.keys(configPg()) as PgConnectionName[];
};
