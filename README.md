# Hono Multi-Database Skeleton

Skeleton API berbasis Bun dan Hono untuk memulai project baru dengan fondasi backend generik, named multi-connections, worker background, migration, dan seeder tooling.

## Features

- Bun runtime
- Hono web framework
- TypeScript
- Named multi-connections for SQLite, MySQL, MongoDB, Redis, and PostgreSQL
- Redis connection helpers and cache utilities
- BullMQ base queue and worker factory
- Migration and seeder tooling
- Common middleware: CORS, secure headers, compression, rate limiting, request logging
- File-based logging with daily rotation
- Health endpoint at `GET /api/health`

## Named Connections

- SQLite: `sqlite1`
- MySQL: `mysql1`, `mysql2`
- MongoDB: `mongo1`, `mongo2`
- Redis: `redis1`, `redis2`
- PostgreSQL: `pg1`, `pg2`

Compatibility defaults still exist for some helpers, but new code should prefer explicit connection targeting.

## Quick Start

```bash
bun install
cp .env.example .env.dev
bun run dev
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server |
| `bun run prod` | Start production server |
| `bun run worker:dev` | Start development worker process |
| `bun run worker:prod` | Start production worker process |
| `bun run migrate:dev` | Run all migrations using `.env.dev` |
| `bun run migrate:prod` | Run all migrations using `.env.prod` |
| `bun run seed:dev` | Run all seeders using `.env.dev` |
| `bun run seed:prod` | Run all seeders using `.env.prod` |
| `bun run make` | Generate files from local stubs |

## Default API

```http
GET /api/health
```

Example response:

```json
{
  "status": "success",
  "message": "OK",
  "data": {
    "uptime": 12.34,
    "timestamp": "2026-04-10T12:34:56.000Z"
  }
}
```

## Documentation

- [Docs Index](./docs/README.md)
- [Project Context](./project_context/README.md)

Recommended reading order:

1. `docs/README.md` for usage, guides, standards, and reference
2. `project_context/README.md` for repo-specific current-state context

## Notes

- Tidak ada domain-specific route, controller, service, atau worker bawaan.
- Worker skeleton tetap tersedia, tetapi default-nya tidak mendaftarkan job apa pun.
- Dukungan database, Redis, cache, queue, migrasi, dan seeding tetap dipertahankan untuk project baru.
- SQLite, MySQL, MongoDB, Redis, dan PostgreSQL sekarang sama-sama memakai named connection model.
