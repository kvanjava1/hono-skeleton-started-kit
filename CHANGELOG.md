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
  - Integration tests for the protocol, form error bag, origin guard, and JSX SSR regression (`tests/integration/inertia.test.ts`).
  - New standard document: `docs/standards/inertia-patterns.md`.

### 🔄 Changed
- Vite now builds both the Tailwind CSS entry and the Svelte client entry (`vite.config.ts`, `@sveltejs/vite-plugin-svelte`); `.svelte` files are type-checked by `svelte-check` (`bun run check:frontend`, also wired into CI).
- Scripts renamed for accuracy: `build:css` → `build:assets`, `dev:css` → `dev:assets` (one Vite build produces CSS + JS + manifest).
- `src/utils/vite.util.ts`: extracted shared manifest loader (`loadViteManifest`) and added `getScriptEntry()` alongside the existing `getStyle()`.
- **Pure JSX SSR example removed** (`src/controllers/web/example/view.controller.ts`, `resources/views/example/`); web pages are now Inertia + Svelte. `resources/views/` is reserved for the Inertia root shell and email templates.
- Inertia client bootstrap resolves pages across multiple client apps (`resources/js/apps/*/pages/`) with app-namespaced page names (`example1/Cruds/Index`).
- `GET /` now serves the Inertia CRUD demo reusing the same `CrudService` and Zod schemas as `/api/example/cruds` (`src/controllers/web/example/crud.controller.ts`): list, create (`POST /cruds`), edit (`GET /cruds/:id/edit`, `PUT /cruds/:id`), soft-delete (`DELETE /cruds/:id`) — all mutations same-origin guarded.

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
