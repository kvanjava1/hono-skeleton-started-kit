/**
 * Application Route Registry
 * Centralized paths to avoid hardcoded strings and ensure type-safety.
 */
export const ROUTES = {
  WEB: {
    ROOT: "/",
    EXAMPLE: {
      LANDING: "/example",
      DASHBOARD: "/example/dashboard",
      DASHBOARD_WILD: "/example/dashboard/*",
    }
  },
  API: {
    HEALTH: "/api/health",
    EXAMPLE: {
      BASE: "/api/examples",
      DETAIL: (id: string | number) => `/api/examples/${id}`,
    }
  }
} as const;

export type AppRoutes = typeof ROUTES;
