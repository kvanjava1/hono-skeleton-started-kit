/**
 * Application Route Registry
 * Centralized base paths to avoid hardcoded strings and ensure consistency.
 */
export const ROUTES = {
  WEB: {
    ROOT: "/",
    EXAMPLE: {
      LANDING: "/example",
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
