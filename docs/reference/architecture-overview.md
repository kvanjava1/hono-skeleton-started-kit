# Architecture Overview

## Overview

Project: Hono Multi-Database Skeleton  
Runtime: Bun  
Framework: Hono  
Entry point: `src/index.ts`

The app supports:

- HTTP API mode
- worker mode via `--worker`
- named multi-connections for SQLite, MySQL, MongoDB, Redis, and PostgreSQL
- Redis cache and BullMQ

## Project Structure

```text
resources/
├── css/
├── js/
└── views/
src/
├── index.ts
├── app.ts
├── configs/
├── routes/
│   └── api/            # health/, docs/, metrics/, example/
├── controllers/
│   └── health/         # health.controller.ts
├── services/
├── repositories/
├── validations/        # Zod request/response schemas
├── database/
│   ├── drizzle.ts      # Drizzle client wrapper
│   └── schema/         # Drizzle table definitions
├── middlewares/
│   └── common/         # termasuk metrics.middleware.ts
├── utils/              # logger, metrics, async, context, cache
├── queues/
├── jobs/
└── workers/
```

## Current Default App Surface

### REST API
- `GET /api/health` — liveness
- `GET /api/health/ready` — readiness (checks enabled dependencies)
- `GET /metrics` — Prometheus metrics (404 when `METRICS_ENABLED=false`)
- `GET /api/spec` — OpenAPI 3.0 JSON spec
- `GET /api/docs` — Scalar API Reference (interactive UI)

### CRUD Example (SQLite)
- `POST /api/example/cruds`
- `GET /api/example/cruds`
- `GET /api/example/cruds/{id}`
- `PUT /api/example/cruds/{id}`
- `DELETE /api/example/cruds/{id}`
- `POST /api/example/cruds/job` — async via BullMQ queue

### Worker
- `src/workers/index.ts` registers `crud-create` worker for async CRUD processing

### Drizzle ORM
SQL repositories use Drizzle ORM as query builder. MongoDB uses native driver.
- Table definitions: `src/database/schema/`
- Drizzle client: `src/database/drizzle.ts` — `getDrizzleDb(connectionName)`

## Database Controls

Environment toggles:

- `DB_SQLITE_ENABLED`
- `DB_MYSQL_ENABLED`
- `DB_PG_ENABLED`
- `DB_MONGO_ENABLED`
- `DB_REDIS_ENABLED`

## Observability Controls

- `LOG_LEVEL` — minimum log level (`debug|info|warn|error`, default `info`)
- `METRICS_ENABLED` — enable `GET /metrics` (default `false`)
- `METRICS_TOKEN` — optional shared secret; requires `x-metrics-token` header

## Worker Model

The worker entry point registers the `crud-create` job (async CRUD creation).
Add new jobs in `src/jobs/` and register them in `src/workers/index.ts`.

Note: queue metrics are recorded in the worker process, which does not expose an
HTTP server, so they are not scrapeable from the API `/metrics` endpoint yet.

[Back to Reference](./README.md)
