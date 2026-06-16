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
} as const;

type RedisConnectionDefinition =
  (typeof REDIS_CONNECTION_DEFAULTS)[keyof typeof REDIS_CONNECTION_DEFAULTS];

import { getStringValue, getNumberValue } from "./env.ts";

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

export interface RedisConnectionConfig {
  host: string;
  port: number;
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
