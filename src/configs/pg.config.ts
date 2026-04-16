const PG_CONNECTION_DEFAULTS = {
  pg1: {
    envKeys: {
      host: "PG_HOST_1",
      port: "PG_PORT_1",
      user: "PG_USER_1",
      password: "PG_PASSWORD_1",
      database: "PG_DATABASE_1",
    },
    legacyEnvKeys: {
      host: "PG_HOST",
      port: "PG_PORT",
      user: "PG_USER",
      password: "PG_PASSWORD",
      database: "PG_DATABASE",
    },
    defaults: {
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: "",
      database: "myapp",
    },
  },
  pg2: {
    envKeys: {
      host: "PG_HOST_2",
      port: "PG_PORT_2",
      user: "PG_USER_2",
      password: "PG_PASSWORD_2",
      database: "PG_DATABASE_2",
    },
    defaults: {
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: "",
      database: "myapp",
    },
  },
} as const;

type PgConnectionDefinition =
  (typeof PG_CONNECTION_DEFAULTS)[keyof typeof PG_CONNECTION_DEFAULTS];

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
  definition: PgConnectionDefinition,
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
  };
};

export const buildPgConfig = (
  env: Record<string, string | undefined> = process.env,
) => {
  return Object.fromEntries(
    Object.entries(PG_CONNECTION_DEFAULTS).map(([name, definition]) => [
      name,
      buildConnectionConfig(definition, env),
    ]),
  ) as {
    [K in keyof typeof PG_CONNECTION_DEFAULTS]: ReturnType<
      typeof buildConnectionConfig
    >;
  };
};

export const configPg = () => {
  return buildPgConfig(process.env);
};

export type ConfigPg = ReturnType<typeof configPg>;
export type PgConnectionName = keyof ConfigPg;

export const getPgConnectionNames = (): PgConnectionName[] => {
  return Object.keys(configPg()) as PgConnectionName[];
};
