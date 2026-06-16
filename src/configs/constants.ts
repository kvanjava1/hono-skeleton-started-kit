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
  NOT_FOUND: "Resource not found",
  CRUD_CREATED: "Crud created successfully",
  CRUD_UPDATED: "Crud updated successfully",
  CRUD_DELETED: "Crud deleted successfully",
  CRUD_NOT_FOUND: "Crud not found",
  CRUDS_FETCHED: "Cruds fetched successfully",
  CRUD_FETCHED: "Crud fetched successfully",
  RATE_LIMIT_EXCEEDED: "Too many requests, please try again later",
  INTERNAL_ERROR: "Internal server error",
  VALIDATION_ERROR: "Validation error",
  DATABASE_ERROR: "Database error",
} as const;

export const LOG_LEVELS = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
} as const;

export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];
