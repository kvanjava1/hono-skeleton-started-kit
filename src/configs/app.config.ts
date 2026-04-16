import { getEnv, getEnvBool, getEnvNumber } from "./env.ts";

export const configApp = {
  port: getEnvNumber("PORT", 8080),
  nodeEnv: getEnv("NODE_ENV", "development"),
  isDevelopment: process.env.NODE_ENV !== "production",
  isProduction: process.env.NODE_ENV === "production",
  db: {
    mongo: getEnvBool("DB_MONGO_ENABLED", false),
    mysql: getEnvBool("DB_MYSQL_ENABLED", false),
    pg: getEnvBool("DB_PG_ENABLED", false),
    sqlite: getEnvBool("DB_SQLITE_ENABLED", false),
    redis: getEnvBool("DB_REDIS_ENABLED", false),
  },
  logRetentionDays: getEnvNumber("LOG_RETENTION_DAYS", 3),
};

export const configRateLimiter = {
  windowMs: getEnvNumber("RATE_LIMIT_WINDOW_MS", 900000),
  max: getEnvNumber("RATE_LIMIT_MAX", 100),
};

export const configCors = {
  origin: getEnv("CORS_ORIGIN", "*"),
};

export type ConfigApp = typeof configApp;
export type ConfigRateLimiter = typeof configRateLimiter;
export type ConfigCors = typeof configCors;
