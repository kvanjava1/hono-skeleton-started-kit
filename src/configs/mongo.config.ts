const MONGO_CONNECTION_DEFAULTS = {
  mongo1: {
    envKeys: {
      host: "MONGO_HOST_1",
      port: "MONGO_PORT_1",
      dbName: "MONGO_DB_NAME_1",
    },
    legacyEnvKeys: {
      host: "MONGO_HOST",
      port: "MONGO_PORT",
      dbName: "MONGO_DB_NAME",
    },
    defaults: {
      host: "localhost",
      port: 27017,
      dbName: "myapp",
    },
  },
  mongo2: {
    envKeys: {
      host: "MONGO_HOST_2",
      port: "MONGO_PORT_2",
      dbName: "MONGO_DB_NAME_2",
    },
    legacyEnvKeys: undefined,
    defaults: {
      host: "localhost",
      port: 27017,
      dbName: "myapp",
    },
  },
} as const;

type MongoConnectionDefinition =
  (typeof MONGO_CONNECTION_DEFAULTS)[keyof typeof MONGO_CONNECTION_DEFAULTS];

import { getStringValue, getNumberValue } from "./env.ts";

const buildConnectionConfig = (
  definition: MongoConnectionDefinition,
  env: Record<string, string | undefined>,
) => {
  const host = getStringValue(
    env,
    definition.envKeys.host,
    definition.defaults.host,
    definition.legacyEnvKeys?.host,
  );
  const port = getNumberValue(
    env,
    definition.envKeys.port,
    definition.defaults.port,
    definition.legacyEnvKeys?.port,
  );
  const dbName = getStringValue(
    env,
    definition.envKeys.dbName,
    definition.defaults.dbName,
    definition.legacyEnvKeys?.dbName,
  );

  return {
    host,
    port,
    dbName,
    getUri() {
      return `mongodb://${host}:${port}/${dbName}`;
    },
  };
};

export interface MongoConnectionConfig {
  host: string;
  port: number;
  dbName: string;
  getUri(): string;
}

export interface MongoConfig {
  mongo1: MongoConnectionConfig;
  mongo2: MongoConnectionConfig;
}

export const buildMongoConfig = (
  env: Record<string, string | undefined> = process.env,
): MongoConfig => {
  return Object.fromEntries(
    Object.entries(MONGO_CONNECTION_DEFAULTS).map(([name, definition]) => [
      name,
      buildConnectionConfig(definition, env),
    ]),
  ) as unknown as MongoConfig;
};

let cachedMongoConfig: MongoConfig | null = null;

export const configMongo = (): MongoConfig => {
  if (!cachedMongoConfig) {
    cachedMongoConfig = buildMongoConfig(process.env);
  }
  return cachedMongoConfig;
};

export type ConfigMongo = MongoConfig;
export type MongoConnectionName = keyof MongoConfig;

export const resetConfigMongo = (): void => {
  cachedMongoConfig = null;
};

export const getMongoConnectionNames = (): MongoConnectionName[] => {
  return Object.keys(configMongo()) as MongoConnectionName[];
};
