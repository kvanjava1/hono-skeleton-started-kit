/**
 * Application Route Registry
 * Centralized base paths to avoid hardcoded strings and ensure consistency.
 *
 * WEB and API paths are the single source of truth: routers, the Svelte
 * client (via `resources/js/lib/routes.ts`), and the `make domain` generator
 * all resolve from here. Param segments use `:name` on WEB (filled by
 * `route()`) and `{name}` on API (OpenAPI notation — `@hono/zod-openapi`
 * converts `{id}` to `:id` for Hono routing automatically), and a missing
 * param throws instead of leaking "undefined" into URLs. This file must
 * stay dependency-free so the client can import it.
 */
export const ROUTES = {
  WEB: {
    ROOT: "/",
    // Dashboard admin (Inertia web — no API surface). LOGIN and LOGIN_SUBMIT
    // share one path on purpose: GET renders the page, POST submits it.
    ADMIN: {
      DASHBOARD: "/admin",
      LOGIN: "/admin/login",
      LOGIN_SUBMIT: "/admin/login",
      LOGOUT: "/admin/logout",
      USERS: "/admin/users",
      USERS_CREATE_PAGE: "/admin/users/create",
      USERS_CREATE: "/admin/users",
      USERS_EDIT_PAGE: "/admin/users/:id/edit",
      USERS_UPDATE: "/admin/users/:id",
      USERS_DELETE: "/admin/users/:id",
      USERS_TOGGLE: "/admin/users/:id/toggle",
      CLIENTS: "/admin/clients",
      CLIENTS_CREATE_PAGE: "/admin/clients/create",
      CLIENTS_CREATE: "/admin/clients",
      CLIENTS_SHOW_PAGE: "/admin/clients/:id",
      CLIENTS_UPDATE: "/admin/clients/:id",
      CLIENTS_DELETE: "/admin/clients/:id",
      CLIENTS_TOGGLE_STATUS: "/admin/clients/:id/toggle-status",
      CLIENTS_MEMBERS_PAGE: "/admin/clients/:id/members",
      CLIENTS_MEMBERS_CREATE_PAGE: "/admin/clients/:id/members/create",
      CLIENTS_MEMBERS_EDIT_PAGE: "/admin/clients/:id/members/:memberId/edit",
      CLIENTS_MEMBERS_UPDATE: "/admin/clients/:id/members/:memberId",
      CLIENTS_MEMBERS_TOGGLE_STATUS: "/admin/clients/:id/members/:memberId/toggle-status",
      CLIENTS_MEMBERS_INVITE: "/admin/clients/:id/members",
      CLIENTS_MEMBERS_REMOVE: "/admin/clients/:id/members/:memberId",
      CLIENTS_API_KEYS_PAGE: "/admin/clients/:id/api-keys",
      CLIENTS_API_KEYS_CREATE: "/admin/clients/:id/api-keys",
      CLIENTS_API_KEYS_REVOKE: "/admin/clients/:id/api-keys/:keyId/revoke",
      API_KEYS: "/admin/api-keys",
      API_KEYS_CREATE: "/admin/api-keys",
      API_KEYS_REVOKE: "/admin/api-keys/:id/revoke",
      TEAM: "/admin/team",
      TEAM_INVITE: "/admin/team/invite",
      TEAM_REMOVE: "/admin/team/:id",
    },
    // [make:web-domain] generator inserts new domains above this line
  },
  // No API endpoints yet — add domains here when the first real API lands.
  API: {
    BASE_PATH: "/api",
  },
  // Non-API operational surface (not part of the OpenAPI contract): health
  // probes, Prometheus metrics, and docs. Docs endpoints are gated by
  // API_DOCS_ENABLED at mount time (see src/routes/system/index.ts).
  SYSTEM: {
    HEALTH: {
      LIVENESS: "/api/health",
      READY: "/api/health/ready",
    },
    METRICS: "/metrics",
    DOCS: {
      SPEC: "/api/spec",
      UI: "/api/docs",
    },
  },
} as const;

/**
 * Fills the `:name` segments of a registry pattern with URL-encoded values.
 * Throws when a required param is missing so an invalid URL can never be
 * built silently (e.g. `/admin/users/undefined`).
 */
export const route = (
  pattern: string,
  params?: Record<string, string | number>,
): string => {
  let missing: string | null = null;
  const filled = pattern.replace(
    /:([A-Za-z_][A-Za-z0-9_]*)/g,
    (segment: string, name: string): string => {
      const value = params?.[name];
      if (value === undefined || value === null) {
        missing = name;
        return segment;
      }
      return encodeURIComponent(String(value));
    },
  );
  if (missing !== null) {
    throw new Error(
      `route(): missing param "${missing}" for pattern "${pattern}"`,
    );
  }
  return filled;
};
