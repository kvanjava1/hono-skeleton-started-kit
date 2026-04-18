# Hono + Vue Hybrid Fullstack Skeleton

Skeleton aplikasi berarsitektur Hybrid Fullstack (Bun + Hono + Vue 3) dengan fondasi SSR, SPA Bridge, Tailwind v4, named multi-connections database, worker background, migration, dan seeder tooling.

## Features

- Bun runtime
- Hono web framework
- TypeScript
- Vue 3 SPA with Vite integration (The Bridge)
- Hono JSX for pure Server-Side Rendering (SSR)
- Tailwind CSS v4 setup
- Named multi-connections for SQLite, MySQL, MongoDB, Redis, and PostgreSQL
- Redis connection helpers and cache utilities
- BullMQ base queue and worker factory
- Migration and seeder tooling
- Modular Middlewares: Isolated `api/`, `web/`, and `common/` namespaces
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
bun run dev:all
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev:all` | Start both Hono (backend) and Vite (frontend) servers |
| `bun run dev` | Start Hono backend server only |
| `bun run dev:client` | Start Vite frontend server only |
| `bun run build:client` | Build Vue assets for production |
| `bun run typecheck` | Run TypeScript type checking |
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
- [Project Context](./context/README.md)

Recommended reading order:

1. `docs/README.md` for usage, guides, standards, and reference
2. `context/README.md` for repo-specific current-state context

## Notes

- Proyek ini dirancang sebagai fondasi. Namun, saat ini menyertakan referensi modul `example` (CRUD, Job) dan rute UI (`Index.tsx`, `IndexVue.tsx`) sebagai contoh implementasi.
- Worker skeleton tersedia, dan job `create-example` diregistrasikan sebagai acuan.
- Dukungan database, Redis, cache, queue, migrasi, dan seeding sepenuhnya modular.
- Arsitektur routing secara jelas memisahkan Pure SSR (`/`) dan Vue SPA Bridge (`/dashboard/*`).
