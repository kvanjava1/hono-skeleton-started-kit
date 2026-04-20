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
    ROOT: "/",
    BASE_PATH: "/api",
    HEALTH: "/api/health",
    EXAMPLE: {
      BASE: "/api/examples",
      DETAIL: (id: string | number) => `/api/examples/${id}`,
    }
  }
} as const;

export type AppRoutes = typeof ROUTES;
