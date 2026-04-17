const MYSQL_CONNECTION_DEFAULTS = {
  mysql1: {
    envKeys: {
      host: "MYSQL_HOST_1",
      port: "MYSQL_PORT_1",
      user: "MYSQL_USER_1",
      password: "MYSQL_PASSWORD_1",
      database: "MYSQL_DATABASE_1",
    },
    legacyEnvKeys: {
      host: "MYSQL_HOST",
      port: "MYSQL_PORT",
      user: "MYSQL_USER",
      password: "MYSQL_PASSWORD",
      database: "MYSQL_DATABASE",
    },
    defaults: {
      host: "localhost",
      port: 3306,
      user: "root",
      password: "",
      database: "myapp",
    },
  },
  mysql2: {
    envKeys: {
      host: "MYSQL_HOST_2",
      port: "MYSQL_PORT_2",
      user: "MYSQL_USER_2",
      password: "MYSQL_PASSWORD_2",
      database: "MYSQL_DATABASE_2",
    },
    legacyEnvKeys: undefined,
    defaults: {
      host: "localhost",
      port: 3306,
      user: "root",
      password: "",
      database: "myapp",
    },
  },
} as const;

type MysqlConnectionDefinition =
  (typeof MYSQL_CONNECTION_DEFAULTS)[keyof typeof MYSQL_CONNECTION_DEFAULTS];

const getStringValue = (
  env: Record<string, string | undefined>,
  envKey: string,
  defaultValue: string,
  fallbackEnvKey?: string,
): string => {
  return env[envKey] ?? (fallbackEnvKey ? env[fallbackEnvKey] : undefined) ?? defaultValue;
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
  definition: MysqlConnectionDefinition,
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
    user: getStringValue(
      env,
      definition.envKeys.user,
      definition.defaults.user,
      definition.legacyEnvKeys?.user,
    ),
    password: getStringValue(
      env,
      definition.envKeys.password,
      definition.defaults.password,
      definition.legacyEnvKeys?.password,
    ),
    database: getStringValue(
      env,
      definition.envKeys.database,
      definition.defaults.database,
      definition.legacyEnvKeys?.database,
    ),
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
  };
};

export const buildMysqlConfig = (
  env: Record<string, string | undefined> = process.env,
) => {
  return Object.fromEntries(
    Object.entries(MYSQL_CONNECTION_DEFAULTS).map(([name, definition]) => [
      name,
      buildConnectionConfig(definition, env),
    ]),
  ) as {
    [K in keyof typeof MYSQL_CONNECTION_DEFAULTS]: ReturnType<
      typeof buildConnectionConfig
    >;
  };
};

export const configMysql = () => {
  return buildMysqlConfig(process.env);
};

export type ConfigMysql = ReturnType<typeof configMysql>;
export type MysqlConnectionName = keyof ConfigMysql;

export const getMysqlConnectionNames = (): MysqlConnectionName[] => {
  return Object.keys(configMysql()) as MysqlConnectionName[];
};
