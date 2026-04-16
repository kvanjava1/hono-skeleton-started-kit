import Redis from "ioredis";
import {
  configRedis,
  configApp,
  getRedisConnectionNames,
  type RedisConnectionName,
} from "../configs/index.ts";
import { logger } from "../utils/logger.util.ts";

const DEFAULT_REDIS_CONNECTION: RedisConnectionName = "redis1";
const redisClients = new Map<RedisConnectionName, Redis>();

const getRedisConfig = (name: RedisConnectionName) => {
  return configRedis()[name];
};

export const createRedisConnection = (
  name: RedisConnectionName = DEFAULT_REDIS_CONNECTION,
): Redis => {
  if (!configApp.db.redis) {
    throw new Error(
      "Redis is disabled in configuration. Enable DB_REDIS_ENABLED=true in your .env file.",
    );
  }

  const existingClient = redisClients.get(name);
  if (existingClient) return existingClient;

  try {
    const redisConfig = getRedisConfig(name);
    const redis = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 1) {
          logger.error(
            `Redis "${name}" reconnection failed after ${times - 1} attempts. Stopping.`,
          );
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on("connect", () => {
      logger.info(
        `Redis connection "${name}" connected to ${redisConfig.host}:${redisConfig.port}`,
      );
    });

    redis.on("error", (error) => {
      logger.error(`Redis connection "${name}" error`, error);
    });

    redisClients.set(name, redis);
    return redis;
  } catch (error) {
    logger.error(`Redis connection "${name}" failed`, error);
    throw error;
  }
};

export const createAllRedisConnections = (): Record<
  RedisConnectionName,
  Redis
> => {
  const connectionNames = getRedisConnectionNames();

  return Object.fromEntries(
    connectionNames.map((name) => [name, createRedisConnection(name)]),
  ) as Record<RedisConnectionName, Redis>;
};

export const getRedis = (
  name: RedisConnectionName = DEFAULT_REDIS_CONNECTION,
): Redis => {
  const existingClient = redisClients.get(name);
  if (!existingClient) {
    return createRedisConnection(name);
  }

  return existingClient;
};

export const closeRedisConnection = async (
  name: RedisConnectionName = DEFAULT_REDIS_CONNECTION,
): Promise<void> => {
  const redis = redisClients.get(name);
  if (redis) {
    await redis.quit();
    redisClients.delete(name);
    logger.info(`Redis connection "${name}" closed`);
  }
};

export const closeAllRedisConnections = async (): Promise<void> => {
  for (const name of getRedisConnectionNames()) {
    await closeRedisConnection(name);
  }
};

export const testRedisConnection = async (
  name: RedisConnectionName = DEFAULT_REDIS_CONNECTION,
): Promise<boolean> => {
  try {
    const client = getRedis(name);
    const result = await client.ping();
    const isOk = result === "PONG";
    if (isOk) logger.info(`Redis connection "${name}" test successful`);
    return isOk;
  } catch (error) {
    logger.error(`Redis connection "${name}" test failed`, error);
    return false;
  }
};

export const testAllRedisConnections = async (): Promise<boolean> => {
  for (const name of getRedisConnectionNames()) {
    const isOk = await testRedisConnection(name);
    if (!isOk) {
      return false;
    }
  }

  return true;
};
