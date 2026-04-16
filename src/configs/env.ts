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
