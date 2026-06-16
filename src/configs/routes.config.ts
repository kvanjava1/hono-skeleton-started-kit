/**
 * Application Route Registry
 * Centralized paths to avoid hardcoded strings and ensure type-safety.
 */
export const ROUTES = {
  WEB: {
    ROOT: "/",
    EXAMPLE: {
      LANDING: "/example",
      EXAMPLE1: "/example/example1",
      EXAMPLE2: "/example/example2",
    }
  },
  API: {
    BASE_PATH: "/api",
    HEALTH: "/api/health",
    EXAMPLE: {
      CRUDS: "/api/example/cruds",
      CRUD_BY_ID: "/api/example/cruds/{id}",
    },
  }
} as const;

