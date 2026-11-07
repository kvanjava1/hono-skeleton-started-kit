/**
 * Client-side access to the web route registry (single source of truth).
 *
 * Straight re-export from `src/configs/routes.config.ts`: that file is kept
 * dependency-free on purpose so importing it from the client bundle is safe
 * (cross-root Vite import, verified by `bun run build:assets`).
 * Web paths and the `route()` resolver come from here — never literals.
 */
export { ROUTES, route } from "../../../src/configs/routes.config.ts";
