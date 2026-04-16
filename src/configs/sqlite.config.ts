import { getEnv } from "./env.ts";

export const configSqlite = () => {
  const defaultConnections = {
    sqlite1: {
      envKey: "SQLITE_DB_PATH_1",
      defaultPath: "./storages/database/sqlite/sqlite1.dev.db",
    },
  } as const;

  return Object.fromEntries(
    Object.entries(defaultConnections).map(([name, definition]) => [
      name,
      {
        envKey: definition.envKey,
        dbPath: getEnv(definition.envKey, definition.defaultPath),
      },
    ]),
  ) as Record<
    keyof typeof defaultConnections,
    {
      envKey: string;
      dbPath: string;
    }
  >;
};

export type ConfigSqlite = ReturnType<typeof configSqlite>;
export type SqliteConnectionName = keyof ConfigSqlite;

export const getSqliteConnectionNames = (): SqliteConnectionName[] => {
  return Object.keys(configSqlite()) as SqliteConnectionName[];
};
