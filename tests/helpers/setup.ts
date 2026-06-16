import { beforeAll } from "bun:test";
import {
  resetConfigApp,
  resetConfigCors,
  resetConfigRateLimiter,
  resetConfigMysql,
  resetConfigPg,
  resetConfigMongo,
  resetConfigRedis,
  resetConfigSqlite,
} from "../../src/configs/index.ts";

export const setupTestEnvironment = (overrides: Record<string, string> = {}) => {
  beforeAll(() => {
    process.env.NODE_ENV = "test";
    process.env.DB_SQLITE_ENABLED = "true";
    process.env.SQLITE_DB_PATH_1 = ":memory:";
    process.env.DB_REDIS_ENABLED = "false";
    process.env.DB_MYSQL_ENABLED = "false";
    process.env.DB_PG_ENABLED = "false";
    process.env.DB_MONGO_ENABLED = "false";
    process.env.LOG_RETENTION_DAYS = "1";

    for (const [key, value] of Object.entries(overrides)) {
      process.env[key] = value;
    }

    resetConfigApp();
    resetConfigCors();
    resetConfigRateLimiter();
    resetConfigMysql();
    resetConfigPg();
    resetConfigMongo();
    resetConfigRedis();
    resetConfigSqlite();
  });
};
