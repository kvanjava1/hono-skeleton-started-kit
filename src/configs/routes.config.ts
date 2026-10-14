/**
 * Application Route Registry
 * Centralized paths to avoid hardcoded strings and ensure type-safety.
 */
export const ROUTES = {
  WEB: {
    ROOT: "/",
    EXAMPLE: {
      LANDING: "/example",
    }
  },
  API: {
    BASE_PATH: "/api",
    HEALTH: "/api/health",
    HEALTH_READY: "/api/health/ready",
    METRICS: "/metrics",
    EXAMPLE: {
      CRUDS: "/api/example/cruds",
      CRUD_BY_ID: "/api/example/cruds/{id}",
      CRUD_CREATE_JOB: "/api/example/cruds/job",
    },
  }
} as const;

