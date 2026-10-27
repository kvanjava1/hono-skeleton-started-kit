import { getEnvBool, getEnvNumber, getStringValue, getNumberValue, getBoolValue } from "./env.ts";

const REDIS_CONNECTION_DEFAULTS = {
  redis1: {
    envKeys: {
      host: "REDIS_HOST_1",
      port: "REDIS_PORT_1",
      db: "REDIS_DB_1",
      password: "REDIS_PASSWORD_1",
      tls: "REDIS_TLS_1",
    },
    legacyEnvKeys: {
      host: "REDIS_HOST",
      port: "REDIS_PORT",
      db: "REDIS_DB",
      password: "REDIS_PASSWORD",
      tls: "REDIS_TLS",
    },
    defaults: {
      host: "localhost",
      port: 6379,
      db: 0,
      password: undefined as string | undefined,
      tls: false,
    },
  },
} as const;

type RedisConnectionDefinition =
  (typeof REDIS_CONNECTION_DEFAULTS)[keyof typeof REDIS_CONNECTION_DEFAULTS];

const buildConnectionConfig = (
  definition: RedisConnectionDefinition,
  env: Record<string, string | undefined>,
) => {
  const rawPassword =
    env[definition.envKeys.password] ??
    (definition.legacyEnvKeys?.password
      ? env[definition.legacyEnvKeys.password]
      : undefined);

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
    db: getNumberValue(
      env,
      definition.envKeys.db,
      definition.defaults.db,
      definition.legacyEnvKeys?.db,
    ),
    password:
      rawPassword && rawPassword.trim().length > 0
        ? rawPassword.trim()
        : undefined,
    tls: getBoolValue(
      env,
      definition.envKeys.tls,
      definition.defaults.tls,
      definition.legacyEnvKeys?.tls,
    ),
  };
};

export interface RedisConnectionConfig {
  host: string;
  port: number;
  db: number;
  password?: string;
  tls?: boolean;
}

export interface RedisConfig {
  redis1: RedisConnectionConfig;
}

export const buildRedisConfig = (
  env: Record<string, string | undefined> = process.env,
): RedisConfig => {
  return Object.fromEntries(
    Object.entries(REDIS_CONNECTION_DEFAULTS).map(([name, definition]) => [
      name,
      buildConnectionConfig(definition, env),
    ]),
  ) as unknown as RedisConfig;
};

let cachedRedisConfig: RedisConfig | null = null;

export const configRedis = (): RedisConfig => {
  if (!cachedRedisConfig) {
    cachedRedisConfig = buildRedisConfig(process.env);
  }
  return cachedRedisConfig;
};

export type ConfigRedis = RedisConfig;
export type RedisConnectionName = keyof RedisConfig;

export const resetConfigRedis = (): void => {
  cachedRedisConfig = null;
};

export const getRedisConnectionNames = (): RedisConnectionName[] => {
  return Object.keys(configRedis()) as RedisConnectionName[];
};

export const configQueue = {
  concurrency: getEnvNumber("QUEUE_CONCURRENCY", 5),
  removeOnComplete: getEnvBool("QUEUE_REMOVE_ON_COMPLETE", true),
  removeOnFail: getEnvNumber("QUEUE_REMOVE_ON_FAIL", 100),
};

export type ConfigQueue = typeof configQueue;
