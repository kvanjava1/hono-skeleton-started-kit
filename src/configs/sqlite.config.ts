import { getEnv } from "./env.ts";

export interface SqliteConnectionConfig {
  envKey: string;
  dbPath: string;
}

export interface SqliteConfig {
  sqlite1: SqliteConnectionConfig;
}

const defaultConnections = {
  sqlite1: {
    envKey: "SQLITE_DB_PATH_1",
    defaultPath: "./storages/database/sqlite/sqlite1.dev.db",
  },
} as const;

let cachedSqliteConfig: SqliteConfig | null = null;

export const configSqlite = (): SqliteConfig => {
  if (!cachedSqliteConfig) {
    cachedSqliteConfig = Object.fromEntries(
      Object.entries(defaultConnections).map(([name, definition]) => [
        name,
        {
          envKey: definition.envKey,
          dbPath: getEnv(definition.envKey, definition.defaultPath),
        },
      ]),
    ) as unknown as SqliteConfig;
  }
  return cachedSqliteConfig;
};

export type ConfigSqlite = SqliteConfig;
export type SqliteConnectionName = keyof SqliteConfig;

export const resetConfigSqlite = (): void => {
  cachedSqliteConfig = null;
};

export const getSqliteConnectionNames = (): SqliteConnectionName[] => {
  return Object.keys(configSqlite()) as SqliteConnectionName[];
};
