# Architecture Overview

## Overview

- **Project**: Hono Multi-Database Skeleton
- **Runtime**: [Bun](https://bun.sh) (pinned to `1.4.3` via `.bun-version`)
- **Framework**: [Hono](https://hono.dev) (`^4.6.0`)
- **ORM / Query Builder**: [Drizzle ORM](https://orm.drizzle.team) (SQL) + Native MongoDB Driver
- **Async Queue**: [BullMQ](https://bullmq.io) + Redis
- **Web UI**: Inertia.js + Svelte 5 (SPA-feel), Hono JSX for the root shell and email templates, Tailwind CSS v4 (via Vite bundler)
- **API Specification**: `@hono/zod-openapi` + `@scalar/hono-api-reference`
- **Entry Point**: `src/index.ts`

The application runs in two distinct execution modes:
1. **HTTP Server Mode**: Runs the Hono web server (serving API endpoints, SSR web pages, documentation, and metrics).
2. **Worker Mode** (`--worker`): Runs background BullMQ queue workers without binding an HTTP port.

---

## Current Project Structure

```text
.
├── resources/
│   ├── css/
│   │   └── app.css               # Tailwind CSS entrypoint
│   ├── js/
│   │   └── apps/                 # Inertia client apps (Svelte 5), one folder per app
│   │       └── dashboard-admin/  # Admin dashboard: app.ts + pages/ (Admin/Login, Admin/Users/Index)
│   │                             #   + components/ (AdminLayout, Button, Modal, Dropdown, ...)
│   └── views/                    # Hono JSX (.tsx)
│       ├── emails/               # Responsive HTML email templates
│       │   ├── layouts/
│       │   └── WelcomeEmail.tsx
│       └── inertia/
│           └── AppShell.tsx      # Inertia root view (HTML shell + page object)
├── public/                       # Public static assets (favicon, images, etc.)
├── storages/
│   ├── database/                 # Local SQLite database files
│   └── logs/                     # JSONL log files (app/, cli/, queue/)
├── scripts/
│   ├── make.ts                   # Code generation CLI
│   ├── migrate.ts                # Database migration runner
│   ├── seed.ts                   # Database seeder runner
│   ├── migrations/               # Per-database migration files
│   ├── seeders/                  # Per-database seeder files
│   └── stubs/                    # Generator code stubs
└── src/
    ├── index.ts                  # Application entry point (bootstrapping app/worker)
    ├── app.ts                    # createApp() factory & middleware pipeline
    ├── configs/                  # App configurations & environment parsing
    ├── routes/
    │   ├── index.ts              # Master route mounter & 404 handler
    │   ├── web/                  # Web routes (Inertia.js + Svelte pages)
    │   │   └── admin/            # Admin dashboard (auth guards + User Management, web-only)
    │   ├── api/                  # API routes (OpenAPI endpoints only — currently empty)
    │   └── system/               # Non-API surface (plain Hono, not in the spec)
    │       ├── health/           # /api/health, /api/health/ready
    │       ├── metrics/          # /metrics (Prometheus)
    │       └── docs/             # /api/spec, /api/docs (gated by API_DOCS_ENABLED)
    ├── controllers/
    │   ├── system/               # Health, metrics & API docs handlers
    │   ├── web/                  # Web controllers (render Inertia pages)
    │   │   └── admin/            # Admin auth + User Management
    │   └── api/                  # API controllers (return JSON via successResponse)
    ├── services/                 # Pure domain business logic layer (admin/)
    ├── repositories/             # Database access layer (admin/)
    ├── validations/              # Zod schemas & request validations (@hono/zod-openapi)
    ├── libraries/                # Technical adapters & 3rd-party transports (mail drivers)
    ├── mail/                     # Mailable classes (envelope, content, template linkage)
    ├── database/
    │   ├── index.ts              # Parallel connection initialization registry
    │   ├── drizzle.ts            # Drizzle ORM client wrapper (getDrizzleDb)
    │   ├── schema/               # Drizzle ORM table definitions
    │   │   └── admin/            # users (Argon2id hash, is_active, soft delete)
    │   └── *.connection.ts       # Driver connection factories (sqlite, mysql, pg, mongo, redis)
    ├── middlewares/
    │   ├── common/               # Context, logger, metrics, rateLimiter, errorHandler
    │   ├── web/                  # Web-specific middlewares (static assets)
    │   └── api/                  # API-specific middlewares (Content-Type validation)
    ├── utils/                    # Utilities: mail facade, logger, response, async, metrics, cache
    ├── queues/                   # BullMQ queue creators & connection options
    ├── jobs/                     # Job definitions & payload interfaces (mail, example)
    └── workers/                  # Worker registry & execution handlers
```

---

## Default Endpoints (Application Surface)

### 1. Admin Dashboard (Inertia.js + Svelte 5 — web surface, no API)
`/` has no page by design (the example CRUD demo was removed with no replacement).

- `GET /admin/login` / `POST /admin/login` — session-cookie login (`Bun.password` Argon2id, generic credential error, CSRF + Origin guarded; the session CSRF token is rotated on login).
- `POST /admin/logout` — drops the session `userId` claim.
- `GET /admin/users` + `POST|PUT|DELETE /admin/users[...]`, `POST /admin/users/{id}/toggle` — User Management (search, status filter, pagination, create/edit modals, activate/deactivate, soft delete). All behind `authGuard`; admins cannot delete or deactivate their own account.
- Data: `users` table on `sqlite1` (soft delete via `deleted_at`; partial unique index on `email` so soft-deleted emails are reusable). First account comes from the `AdminUserSeeder` (dev only — refuses to run in production).

### 2. System & Observability (not part of the OpenAPI spec)
- `GET /api/health` — Liveness probe (verifies process is responsive).
- `GET /api/health/ready` — Readiness probe (checks active database and Redis connections).
- `GET /metrics` — Prometheus metrics (enabled when `METRICS_ENABLED=true`, optionally guarded by `x-metrics-token`).

### 3. API Documentation (dev/test only)
Registered only when `API_DOCS_ENABLED=true` (default `false` — production answers a natural 404 because the routes are never mounted; see `src/routes/system/index.ts`).
- `GET /api/spec` — OpenAPI 3.0 JSON specification.
- `GET /api/docs` — Interactive Scalar API Reference UI.

### 4. API domains
None registered yet — `ROUTES.API` holds only `BASE_PATH` (`/api`) and `src/routes/api/index.ts` mounts no domain. The wiring (registry → router → controller → service → repository) stays in place for the first real API; the mail worker (`send-email` queue) and the mail system remain available independently.

---

## Multi-Database Connection Model

All database engines support explicit **named connections**:
- **SQLite**: `sqlite1`, ...
- **MySQL**: `mysql1`, ...
- **PostgreSQL**: `pg1`, ...
- **MongoDB**: `mongo1`, ...
- **Redis**: `redis1`, ...

Database connections are enabled or disabled via environment boolean flags (`DB_SQLITE_ENABLED`, `DB_MYSQL_ENABLED`, `DB_PG_ENABLED`, `DB_MONGO_ENABLED`, `DB_REDIS_ENABLED`). Disabled databases will not initialize or block the startup sequence.

---

## Mail System Architecture

The application provides a type-safe, multi-driver mail system:
- **Drivers (`src/libraries/mail/drivers/`)**: `log` (default for dev/testing), `smtp` (Nodemailer connection pool), and `resend` (HTTP API).
- **Utility Facade (`src/utils/mail.util.ts`)**: `Mail.to(recipient).queue(mailable)` or `Mail.to(recipient).send(mailable)`.
- **Background Worker (`src/workers/index.ts`)**: Consumes the `send-email` BullMQ queue to send emails asynchronously without blocking web requests.

---

## Background Worker Model

Workers run as a separate background process:
```bash
bun run worker:code:dev
# or in production:
bun run worker:code:prod
```
The worker processes BullMQ jobs from Redis independently without blocking the HTTP server event loop.

[Back to Reference](./README.md)
