# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### 🚀 Added
- **Inertia.js + Svelte 5 Integration (PoC):**
  - Official `@hono/inertia` middleware wired into the web layer (`src/middlewares/web/index.ts`) with the Inertia protocol: HTML shell on first visit, JSON page objects on `X-Inertia` navigation, `409 + X-Inertia-Location` on asset version mismatch.
  - Asset versioning sourced from the SHA-256 hash of the Vite manifest (`src/utils/inertia.util.ts`).
  - Shared props for every Inertia page (`appName`, `isDev`) via the middleware `share` option.
  - Root view shell `resources/views/inertia/AppShell.tsx` embedding the serialized page object (`serializePage`).
  - Svelte 5 client bootstrap **per client app** (`resources/js/apps/<app>/app.ts`, copied verbatim for new apps) with lazy `import.meta.glob` page resolution, app-namespaced page names (`example1/Cruds/Index`), and per-page code splitting.
  - CRUD demo page at `GET /` (`resources/js/apps/example1/pages/Cruds/` + `src/controllers/web/example/crud.controller.ts`) as the living reference — **reusing the same `CrudService` and Zod schemas as `/api/example/cruds`**.
  - Form validation mapped to the Inertia error bag (`toInertiaErrorBag`) and returned as `422 { errors }` for `X-Inertia` requests via the Global Error Handler — `useForm()` fills its error bag automatically.
  - Same-origin guard for unsafe web methods (`src/middlewares/web/sameOrigin.middleware.ts`) covering JSON content-types that the built-in `hono/csrf` does not.
  - **Session layer** (Laravel `SESSION_DRIVER=cookie` parity): signed-cookie session holding the CSRF token + flash bag (`src/utils/session.util.ts`, `session.middleware.ts`), configured via `SESSION_SECRET` (required in production), `SESSION_COOKIE_NAME`, `SESSION_TTL_MINUTES`; API paths stay cookie-free.
  - **Two-layer CSRF guard** (`csrfGuard`): Origin/Referer check + session-bound token via the `XSRF-TOKEN` cookie that the Inertia client mirrors into `X-XSRF-TOKEN` automatically (verified in `@inertiajs/core` 3.11 `XhrHttpClient`); mutations without a valid token are rejected with 403.
  - **Flash messages**: consume-once `flash`/`errors` shared props (`flashSuccess`/`flashError`), one-shot banner in the demo pages, and the service-level `ValidationError` fallback now redirects back (303) with flashed errors instead of the plain JSON the client rejected with its modal.
  - Integration tests for the protocol, form error bag, origin guard, and JSX SSR regression (`tests/integration/inertia.test.ts`).
  - New standard document: `docs/standards/inertia-patterns.md`.

### 🔄 Changed
- Vite now builds both the Tailwind CSS entry and the Svelte client entry (`vite.config.ts`, `@sveltejs/vite-plugin-svelte`); `.svelte` files are type-checked by `svelte-check` (`bun run check:frontend`, also wired into CI).
- Scripts renamed for accuracy: `build:css` → `build:assets`, `dev:css` → `dev:assets` (one Vite build produces CSS + JS + manifest).
- `src/utils/vite.util.ts`: extracted shared manifest loader (`loadViteManifest`) and added `getScriptEntry()` alongside the existing `getStyle()`.
- **Pure JSX SSR example removed** (`src/controllers/web/example/view.controller.ts`, `resources/views/example/`); web pages are now Inertia + Svelte. `resources/views/` is reserved for the Inertia root shell and email templates.
- Inertia client bootstrap resolves pages across multiple client apps (`resources/js/apps/*/pages/`) with app-namespaced page names (`example1/Cruds/Index`).
- `GET /` now serves the Inertia CRUD demo reusing the same `CrudService` and Zod schemas as `/api/example/cruds` (`src/controllers/web/example/crud.controller.ts`): list, create (`POST /cruds`), edit (`GET /cruds/:id/edit`, `PUT /cruds/:id`), soft-delete (`DELETE /cruds/:id`) — all mutations same-origin guarded.

### 🐛 Fixed
- **Inertia form validation errors now reach `useForm()` on `@inertiajs/core` 3.x:** the previous `422 { errors }` plain-JSON response was rejected by the client ("plain JSON response" error modal) and the error bag never filled. Web controllers now re-render the origin page at `422` as a valid Inertia response — `X-Inertia` response header + full page envelope with `errors` merged into `props` (`inertiaValidationErrorResponse` in `src/utils/inertia.util.ts`); HTTP status stays `422`.
- **Svelte CRUD pages (`resources/js/apps/example1/pages/Cruds/`):** the create form resets its fields after a successful create (prevents accidental duplicate submissions), the edit page's Cancel action uses Inertia `<Link>` (SPA navigation, no full page reload), and the dead `/spa-demo` link was removed.

### 🔄 Changed (route registry)
- Web paths now resolve from the **`ROUTES.WEB` registry** (`src/configs/routes.config.ts`) with the **`route(pattern, params)` helper** (throws on missing params); the registry is re-exported to the client via `resources/js/lib/routes.ts` (cross-root Vite import, verified by `build:assets`). The web CRUD router and both Svelte pages now reference the constants — the previously unused and wrong `EXAMPLE_CRUD.INDEX` (`/cruds` → `/`) is fixed.
- `make domain` now scaffolds the `ROUTES.WEB.<DOMAIN>` block automatically (inserted above the `[make:web-domain]` marker) and its web-router stub references the registry constants instead of literals.

### 🗑️ Removed
- Dead code `src/validations/spa/spa.ts` (`DemoContactForm`) — a leftover of the removed Vue SPA demo, referenced nowhere.

---

## [1.0.0-beta.2] - 2026-10-29

### 🚀 Added
- **Laravel-Style Mail System:**
  - `Mailable` abstract interface and domain mailable classes (`src/mail/`).
  - Multi-driver transport layer (`src/libraries/mail/drivers/`) supporting `log` (safe for dev/test), `smtp` (via `nodemailer`), and `resend` (via REST API).
  - Type-safe, responsive HTML email templates using native Hono JSX components (`resources/views/emails/layouts/EmailLayout.tsx` & `WelcomeEmail.tsx`).
  - Fluent dispatcher facade (`src/utils/mail.util.ts`) with `Mail.to().send()` (synchronous) and `Mail.to().queue()` (asynchronous).
  - Asynchronous background job integration via BullMQ queue (`src/jobs/mail/sendEmail.job.ts`) with automatic retry backoff and `requestContext` trace ID propagation.
  - CLI scaffolding command: `bun run make mail <name>` to generate mailable classes and JSX templates.
  - Living reference endpoint: `POST /api/example/cruds/send-email` returning HTTP 202 Accepted.
- **Documentation:**
  - Added comprehensive Mail System guide (`docs/guides/mail.md`).
  - Added Master Guides Index (`docs/guides/README.md`).
  - Updated Architecture standards, naming conventions, and Architecture Overview with mail flow diagrams.

### 🔄 Changed
- Refactored low-level transport drivers to `src/libraries/mail/` and application-facing facade to `src/utils/mail.util.ts` to keep `src/services/` strictly 100% domain-specific.
- Updated `README.md` with new mail features, updated CLI make commands, and expanded test counts (120 tests, 267 assertions).

### 🐛 Fixed
- Fixed rate limiter in-memory store state leak across test suites by adding `resetRateLimiterMemoryStore()` in `tests/helpers/setup.ts` and test teardown hooks.
- Modernized GitHub Actions CI test workflow with `--frozen-lockfile`, `bun-version-file: "package.json"`, and manual `workflow_dispatch` trigger.

---

## [1.0.0-beta.1] - 2026-10-28

### 🚀 Added
- Initial beta release of `hono-skeleton-started-kit`.
- Dual routing architecture: OpenAPI REST API (`/api/*`) and Hono JSX Server-Side Rendering (`/*`).
- Multi-database connection architecture with Drizzle ORM (SQLite, MySQL, PostgreSQL, MongoDB).
- Distributed asynchronous task queue using BullMQ and Redis.
- Structured logging using Pino with correlation ID propagation (`AsyncLocalStorage`).
- Prometheus telemetry metrics collector at `GET /metrics`.
- Health check probes at `GET /api/health` and `GET /api/health/ready`.
- CLI generator (`bun run make <type> <name>`) and database migration runner (`scripts/migrate.ts`).
- Full test suite with unit and integration tests.
