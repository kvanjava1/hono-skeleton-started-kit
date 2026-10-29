# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
