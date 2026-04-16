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
src/
├── index.ts
├── app.ts
├── configs/
├── routes/
├── controllers/
├── services/
├── repositories/
├── schemas/
├── middlewares/
├── utils/
├── database/
├── queues/
├── jobs/
└── workers/
```

## Current Default App Surface

- `GET /api/health`

No domain-specific route or worker is registered by default.

## Database Controls

Environment toggles:

- `DB_SQLITE_ENABLED`
- `DB_MYSQL_ENABLED`
- `DB_PG_ENABLED`
- `DB_MONGO_ENABLED`
- `DB_REDIS_ENABLED`

## Worker Model

The worker entry point exists, but the default skeleton does not register any job. You add jobs in `src/jobs/` and register them in `src/workers/index.ts`.

[Back to Reference](./README.md)
