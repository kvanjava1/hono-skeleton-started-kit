# Architecture Overview

## Overview

- **Project**: Hono Multi-Database Skeleton
- **Runtime**: [Bun](https://bun.sh) (pinned to `1.4.3` via `.bun-version`)
- **Framework**: [Hono](https://hono.dev) (`^4.6.0`)
- **ORM / Query Builder**: [Drizzle ORM](https://orm.drizzle.team) (SQL) + Native MongoDB Driver
- **Async Queue**: [BullMQ](https://bullmq.io) + Redis
- **Templating / UI**: Hono JSX SSR + [Tailwind CSS v4](https://tailwindcss.com) (via Vite bundler)
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
│   ├── js/                       # Optional client-side JS scripts
│   └── views/                    # Server-rendered Hono JSX components (.tsx)
│       ├── emails/               # Responsive HTML email templates
│       │   ├── layouts/
│       │   └── WelcomeEmail.tsx
│       └── example/
│           ├── Index.tsx
│           └── Layout.tsx
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
    │   ├── web/                  # Web routes (SSR Hono JSX)
    │   │   └── example/
    │   └── api/                  # API routes (OpenAPI endpoints)
    │       ├── health/           # /api/health, /api/health/ready
    │       ├── docs/             # /api/spec, /api/docs
    │       ├── metrics/          # /metrics (Prometheus)
    │       └── example/          # CRUD sample routes
    ├── controllers/
    │   ├── health/               # Health & readiness handlers
    │   └── example/
    │       ├── web/              # Web controllers (return HTML/JSX)
    │       └── api/              # API controllers (return JSON via successResponse)
    ├── services/                 # Pure domain business logic layer
    ├── repositories/             # Database access layer
    ├── validations/              # Zod schemas & request validations (@hono/zod-openapi)
    ├── libraries/                # Technical adapters & 3rd-party transports (mail drivers)
    ├── mail/                     # Mailable classes (envelope, content, template linkage)
    ├── database/
    │   ├── index.ts              # Parallel connection initialization registry
    │   ├── drizzle.ts            # Drizzle ORM client wrapper (getDrizzleDb)
    │   ├── schema/               # Drizzle ORM table definitions
    │   │   └── example/
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

### 1. Web (Server-Side Rendered JSX)
- `GET /` — SSR landing page with Tailwind CSS.

### 2. System & Observability
- `GET /api/health` — Liveness probe (verifies process is responsive).
- `GET /api/health/ready` — Readiness probe (checks active database and Redis connections).
- `GET /metrics` — Prometheus metrics (enabled when `METRICS_ENABLED=true`, optionally guarded by `x-metrics-token`).

### 3. API Documentation
- `GET /api/spec` — OpenAPI 3.0 JSON specification.
- `GET /api/docs` — Interactive Scalar API Reference UI.

### 4. Sample CRUD Feature (`/api/example/cruds`)
- `GET /api/example/cruds` — List all records (backed by Redis cache).
- `GET /api/example/cruds/{id}` — Retrieve a single record.
- `POST /api/example/cruds` — Create a new record (automatically validated via Zod).
- `PUT /api/example/cruds/{id}` — Update an existing record.
- `DELETE /api/example/cruds/{id}` — Delete a record.
- `POST /api/example/cruds/job` — Dispatch record creation asynchronously via BullMQ queue.
- `POST /api/example/cruds/send-email` — Dispatch example welcome email asynchronously via BullMQ queue.

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
