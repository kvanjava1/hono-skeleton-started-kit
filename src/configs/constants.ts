export const APP_NAME = "Hono Multi-DB API";

export const HTTP_STATUS = {
  OK: 200,
  ACCEPTED: 202,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  TOO_MANY_REQUESTS: 429,
} as const;

export const MESSAGES = {
  HELLO_WORLD: "Hello World",
  HEALTH_OK: "OK",
  USER_CREATED: "User created successfully",
  USER_UPDATED: "User updated successfully",
  USER_DELETED: "User deleted successfully",
  USER_NOT_FOUND: "User not found",
  USERS_FETCHED: "Users fetched successfully",
  USER_FETCHED: "User fetched successfully",
  EXAMPLE_CREATED: "Example created successfully",
  EXAMPLE_UPDATED: "Example updated successfully",
  EXAMPLE_DELETED: "Example deleted successfully",
  EXAMPLE_NOT_FOUND: "Example not found",
  EXAMPLES_FETCHED: "Examples fetched successfully",
  EXAMPLE_FETCHED: "Example fetched successfully",
  RATE_LIMIT_EXCEEDED: "Too many requests, please try again later",
  INTERNAL_ERROR: "Internal server error",
  VALIDATION_ERROR: "Validation error",
  DATABASE_ERROR: "Database error",
} as const;

export const BCRYPT_SALT_ROUNDS = 10;

export const LOG_LEVELS = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
} as const;

export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];
