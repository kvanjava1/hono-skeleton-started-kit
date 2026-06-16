export const getStringValue = (
  env: Record<string, string | undefined>,
  envKey: string,
  defaultValue: string,
  fallbackEnvKey?: string,
): string => {
  return env[envKey] ?? (fallbackEnvKey ? env[fallbackEnvKey] : undefined) ?? defaultValue;
};

export const getNumberValue = (
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

export const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
};

export const getEnvNumber = (key: string, defaultValue?: number): number => {
  const stringValue = process.env[key]?.trim();
  if (stringValue === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is required`);
    }
    return defaultValue;
  }

  const value = parseInt(stringValue, 10);
  if (Number.isNaN(value)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }

  return value;
};

export const getEnvBool = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key]?.trim().toLowerCase();
  if (value === undefined) {
    return defaultValue;
  }

  return value === "true" || value === "1" || value === "yes";
};
