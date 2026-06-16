const PG_CONNECTION_DEFAULTS = {
  pg1: {
    envKeys: {
      host: "PG_HOST_1",
      port: "PG_PORT_1",
      user: "PG_USER_1",
      password: "PG_PASSWORD_1",
      database: "PG_DATABASE_1",
    },
    legacyEnvKeys: {
      host: "PG_HOST",
      port: "PG_PORT",
      user: "PG_USER",
      password: "PG_PASSWORD",
      database: "PG_DATABASE",
    },
    defaults: {
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: "",
      database: "myapp",
    },
  },
  pg2: {
    envKeys: {
      host: "PG_HOST_2",
      port: "PG_PORT_2",
      user: "PG_USER_2",
      password: "PG_PASSWORD_2",
      database: "PG_DATABASE_2",
    },
    legacyEnvKeys: undefined,
    defaults: {
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: "",
      database: "myapp",
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
  };
};

export interface PgConnectionConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface PgConfig {
  pg1: PgConnectionConfig;
  pg2: PgConnectionConfig;
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
