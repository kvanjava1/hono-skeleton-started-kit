import { getEnvBool, getEnvNumber } from "./env.ts";

const REDIS_CONNECTION_DEFAULTS = {
  redis1: {
    envKeys: {
      host: "REDIS_HOST_1",
      port: "REDIS_PORT_1",
    },
    legacyEnvKeys: {
      host: "REDIS_HOST",
      port: "REDIS_PORT",
    },
    defaults: {
      host: "localhost",
      port: 6379,
    },
  },
  redis2: {
    envKeys: {
      host: "REDIS_HOST_2",
      port: "REDIS_PORT_2",
    },
    defaults: {
      host: "localhost",
      port: 6379,
    },
  },
} as const;

type RedisConnectionDefinition =
  (typeof REDIS_CONNECTION_DEFAULTS)[keyof typeof REDIS_CONNECTION_DEFAULTS];

const getStringValue = (
  env: Record<string, string | undefined>,
  envKey: string,
  defaultValue: string,
  fallbackEnvKey?: string,
): string => {
  return (
    env[envKey] ??
    (fallbackEnvKey ? env[fallbackEnvKey] : undefined) ??
    defaultValue
  );
};

const getNumberValue = (
  env: Record<string, string | undefined>,
  envKey: string,
  defaultValue: number,
  fallbackEnvKey?: string,
): number => {
  const rawValue =
    env[envKey] ?? (fallbackEnvKey ? env[fallbackEnvKey] : undefined);

  if (rawValue === undefined) {
    return defaultValue;
  }

  const parsedValue = Number.parseInt(rawValue.trim(), 10);
  if (Number.isNaN(parsedValue)) {
    throw new Error(`Environment variable ${envKey} must be a number`);
  }

  return parsedValue;
};

const buildConnectionConfig = (
  definition: RedisConnectionDefinition,
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
  };
};

export const buildRedisConfig = (
  env: Record<string, string | undefined> = process.env,
) => {
  return Object.fromEntries(
    Object.entries(REDIS_CONNECTION_DEFAULTS).map(([name, definition]) => [
      name,
      buildConnectionConfig(definition, env),
    ]),
  ) as {
    [K in keyof typeof REDIS_CONNECTION_DEFAULTS]: ReturnType<
      typeof buildConnectionConfig
    >;
  };
};

export const configRedis = () => {
  return buildRedisConfig(process.env);
};

export type ConfigRedis = ReturnType<typeof configRedis>;
export type RedisConnectionName = keyof ConfigRedis;

export const getRedisConnectionNames = (): RedisConnectionName[] => {
  return Object.keys(configRedis()) as RedisConnectionName[];
};

export const configQueue = {
  concurrency: getEnvNumber("QUEUE_CONCURRENCY", 5),
  removeOnComplete: getEnvBool("QUEUE_REMOVE_ON_COMPLETE", true),
  removeOnFail: getEnvNumber("QUEUE_REMOVE_ON_FAIL", 100),
};

export type ConfigQueue = typeof configQueue;
