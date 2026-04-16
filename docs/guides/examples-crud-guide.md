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

## Files

- `src/routes/example.routes.ts`
- `src/controllers/example.controller.ts`
- `src/services/sqlite/example.service.ts`
- `src/repositories/sqlite/example.repository.ts`
- `src/schemas/example.schema.ts`
- `src/jobs/CreateExample.job.ts`
- `src/workers/index.ts`
- `scripts/migrations/sqlite/files/20260410080127_create_examples.ts`
- `scripts/migrations/sqlite/files/20260415170000_prepare_examples_crud.ts`
- `tests/examples.crud.test.ts`

## Queue Behavior

`POST /api/examples` is asynchronous.

Flow:

1. request is validated
2. password is hashed
3. `create-example` job is queued
4. API returns `202 Accepted`
5. worker inserts into SQLite

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
bun test tests/examples.crud.test.ts
```
