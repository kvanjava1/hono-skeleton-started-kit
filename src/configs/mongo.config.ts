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

export const buildMongoConfig = (
  env: Record<string, string | undefined> = process.env,
) => {
  return Object.fromEntries(
    Object.entries(MONGO_CONNECTION_DEFAULTS).map(([name, definition]) => [
      name,
      buildConnectionConfig(definition, env),
    ]),
  ) as {
    [K in keyof typeof MONGO_CONNECTION_DEFAULTS]: ReturnType<
      typeof buildConnectionConfig
    >;
  };
};

export const configMongo = () => {
  return buildMongoConfig(process.env);
};

export type ConfigMongo = ReturnType<typeof configMongo>;
export type MongoConnectionName = keyof ConfigMongo;

export const getMongoConnectionNames = (): MongoConnectionName[] => {
  return Object.keys(configMongo()) as MongoConnectionName[];
};
