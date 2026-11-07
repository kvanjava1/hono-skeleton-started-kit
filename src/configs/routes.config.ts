/**
 * Application Route Registry
 * Centralized base paths to avoid hardcoded strings and ensure consistency.
 */
export const ROUTES = {
  WEB: {
    ROOT: "/",
    EXAMPLE_CRUD: {
      INDEX: "/cruds",
      EDIT: "/cruds/:id/edit",
      CREATE: "/cruds",
      UPDATE: "/cruds/:id",
      DELETE: "/cruds/:id",
    },
  },
  API: {
    BASE_PATH: "/api",
    HEALTH: "/api/health",
    METRICS: "/metrics",
    EXAMPLE: {
      CRUDS: "/api/example/cruds",
    },
  },
} as const;
