# Examples CRUD Guide

This guide documents the neutral example CRUD module shipped with the skeleton.

## Goal

Expose a full reference module without forcing a real business domain like `users`.

Endpoints:

- `POST /api/examples`
- `GET /api/examples`
- `GET /api/examples/:id`
- `PUT /api/examples/:id`
- `DELETE /api/examples/:id`

## Why `example`

The module is intentionally named `example` so teams can:

- study a complete implementation
- keep a runnable reference
- delete or replace it later without business-domain confusion

## Layering

The module follows:

1. migration
2. schema
3. repository
4. service
5. controller
6. route
7. job
8. worker registration

## Files (Modular Structure)

- `src/routes/api/example/crudWithJob.routes.ts`
- `src/controllers/example/crudWithJob.controller.ts`
- `src/services/sqlite/example/crudWithJob.service.ts`
- `src/repositories/sqlite/example/crudWithJob.repository.ts`
- `src/schemas/example/crudWithJob.schema.ts`
- `src/jobs/example/crudWithJobCreate.job.ts`
- `src/jobs/example/crudWithJobUpdate.job.ts`
- `src/workers/index.ts` (Registration)
- `tests/example/crudWithJob.test.ts`

## Queue Behavior

Both `POST /api/examples` and `PUT /api/examples/:id` are asynchronous.

Flow:

1. Request is validated (Zod)
2. Sensitive data (password) is hashed
3. Job is dispatched to Redis via BullMQ (`crudWithJobCreate` or `crudWithJobUpdate`)
4. API returns `202 Accepted` with a `job_id`
5. Worker processes the job and persists data to SQLite
6. Worker invalidates relevant Redis cache patterns

## Cache Behavior

Only `GET /api/examples` is cached.

Cache prefix:

- `examples:list:`

Examples:

- `examples:list:limit=10&page=1`
- `examples:list:full_name=Beta&limit=1&page=1`
- `examples:list:email=search.target%40example.com&limit=5&page=1`

Rules:

- query is normalized before building the key
- TTL is `120` seconds
- cache is invalidated with `examples:list:*`
- invalidation happens after successful create, update, and delete

## Commands

```bash
bun run migrate:dev sqlite
bun run dev
bun run worker:dev
bun test tests/example/crudWithJob.test.ts
```
