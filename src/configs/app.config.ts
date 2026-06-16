import { getEnv, getEnvBool, getEnvNumber } from "./env.ts";

export interface ConfigDatabaseToggles {
  mongo: boolean;
  mysql: boolean;
  pg: boolean;
  sqlite: boolean;
  redis: boolean;
}

export interface ConfigApp {
  port: number;
  nodeEnv: string;
  isDevelopment(): boolean;
  isProduction(): boolean;
  db: ConfigDatabaseToggles;
  logRetentionDays: number;
}

const buildConfigApp = (): ConfigApp => ({
  port: getEnvNumber("PORT", 8080),
  nodeEnv: getEnv("NODE_ENV", "development"),
  isDevelopment: () => configApp.nodeEnv !== "production",
  isProduction: () => configApp.nodeEnv === "production",
  db: {
    mongo: getEnvBool("DB_MONGO_ENABLED", false),
    mysql: getEnvBool("DB_MYSQL_ENABLED", false),
    pg: getEnvBool("DB_PG_ENABLED", false),
    sqlite: getEnvBool("DB_SQLITE_ENABLED", false),
    redis: getEnvBool("DB_REDIS_ENABLED", false),
  },
  logRetentionDays: getEnvNumber("LOG_RETENTION_DAYS", 3),
});

let _cachedConfigApp: ConfigApp | null = null;

const getCached = (): ConfigApp => {
  if (!_cachedConfigApp) _cachedConfigApp = buildConfigApp();
  return _cachedConfigApp;
};

export const configApp = new Proxy<ConfigApp>({} as ConfigApp, {
  get(_, prop) { return getCached()[prop as keyof ConfigApp]; },
});

export const resetConfigApp = (): void => {
  _cachedConfigApp = null;
};

function createLazyConfig<T extends object>(build: () => T): { proxy: T; reset(): void } {
  let cached: T | null = null;
  return {
    proxy: new Proxy<T>({} as T, {
      get(_, prop) {
        if (!cached) cached = build();
        return cached[prop as keyof T];
      },
    }),
    reset: () => { cached = null; },
  };
}

export interface ConfigRateLimiter {
  windowMs: number;
  max: number;
}

const { proxy: configRateLimiter, reset: resetConfigRateLimiter } = createLazyConfig((): ConfigRateLimiter => ({
  windowMs: getEnvNumber("RATE_LIMIT_WINDOW_MS", 900000),
  max: getEnvNumber("RATE_LIMIT_MAX", 100),
}));
export { configRateLimiter, resetConfigRateLimiter };

export interface ConfigCors {
  origin: string;
}

const { proxy: configCors, reset: resetConfigCors } = createLazyConfig((): ConfigCors => ({
  origin: getEnv("CORS_ORIGIN", "*"),
}));
export { configCors, resetConfigCors };
