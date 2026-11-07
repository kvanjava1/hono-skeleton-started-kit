/**
 * Application Route Registry
 * Centralized base paths to avoid hardcoded strings and ensure consistency.
 *
 * WEB paths are the single source of truth: the web router, the Svelte
 * client (via `resources/js/lib/routes.ts`), and the `make domain` generator
 * all resolve from here. Param segments use `:name` and are filled by
 * `route()` — a missing param throws instead of leaking "undefined" into
 * URLs. This file must stay dependency-free so the client can import it.
 */
export const ROUTES = {
  WEB: {
    ROOT: "/",
    EXAMPLE_CRUD: {
      INDEX: "/",
      CREATE: "/cruds",
      EDIT: "/cruds/:id/edit",
      UPDATE: "/cruds/:id",
      DELETE: "/cruds/:id",
    },
    // [make:web-domain] generator inserts new domains above this line
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

/**
 * Fills the `:name` segments of a registry pattern with URL-encoded values.
 * Throws when a required param is missing so an invalid URL can never be
 * built silently (e.g. `/cruds/undefined/edit`).
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
