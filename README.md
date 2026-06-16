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
- **Drizzle ORM** for SQL databases (SQLite, MySQL, PostgreSQL)
- Redis connection helpers and cache utilities
- BullMQ base queue and worker factory
- Migration and seeder tooling
- Modular Middlewares: Isolated `api/`, `web/`, and `common/` namespaces
- File-based logging with daily rotation
- Health endpoint at `GET /api/health`
- **OpenAPI 3.0** spec generation via `@hono/zod-openapi`
- **Scalar API Reference** at `/api/docs` (interactive API docs)
- **Content-Type enforcement** — rejects non-JSON POST/PUT/PATCH with HTTP 415
- **Soft delete** support with `deleted_at` column pattern
- **Async job processing** via BullMQ queue + worker

## Named Connections

- SQLite: `sqlite1`
- MySQL: `mysql1`
- MongoDB: `mongo1`
- Redis: `redis1`
- PostgreSQL: `pg1`

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
| `bun test` | Run all tests (currently **49 tests, 77 expects, 0 fail**) |
| `bun run prod` | Start production server |
| `bun run worker:dev` | Start development worker process |
| `bun run worker:prod` | Start production worker process |
| `bun run migrate:dev` | Run all migrations using `.env.dev` |
| `bun run migrate:prod` | Run all migrations using `.env.prod` |
| `bun run migrate:fresh:dev <target>` | Drop + re-run migrations for `<target>` (sqlite, mysql, pg, mongo) |
| `bun run migrate:fresh:prod <target>` | Drop + re-run migrations for `<target>` (sqlite, mysql, pg, mongo) |
| `bun run seed:dev` | Run all seeders using `.env.dev` |
| `bun run seed:prod` | Run all seeders using `.env.prod` |
| `bun run make` | Generate files from local stubs |

## Default API

### REST API

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

### CRUD Example (SQLite)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/example/cruds` | Create a new CRUD item |
| GET | `/api/example/cruds` | List all CRUD items (cached) |
| GET | `/api/example/cruds/{id}` | Get a CRUD item by ID (cached) |
| PUT | `/api/example/cruds/{id}` | Update a CRUD item |
| DELETE | `/api/example/cruds/{id}` | Soft-delete a CRUD item |
| POST | `/api/example/cruds/job` | Enqueue async CRUD creation via BullMQ |

### OpenAPI Documentation

```http
GET /api/spec    # OpenAPI 3.0 JSON spec
GET /api/docs    # Scalar API Reference (interactive)
```

## Documentation

- [Docs Index](./docs/README.md)
- [Project Context](./context/README.md)

Recommended reading order:

1. `docs/README.md` for usage, guides, standards, and reference
2. `context/README.md` for repo-specific current-state context

## Notes

- Proyek ini dirancang sebagai fondasi. Saat ini menyertakan rute UI (`Index.tsx`, `IndexVue.tsx`) sebagai contoh implementasi web.
- Dukungan database, Redis, cache, queue, migrasi, dan seeding sepenuhnya modular.
- Arsitektur routing secara jelas memisahkan Pure SSR (`/`) dan Vue SPA Bridge (`/example/*`).
- Worker skeleton tersedia dan siap diisi dengan job domain.
- Semua POST/PUT/PATCH ke `/api/*` **wajib** menyertakan header `Content-Type: application/json` — jika tidak, server mengembalikan HTTP 415.
- Redis **tidak wajib** untuk development (`DB_REDIS_ENABLED=false`). Tanpa Redis, cache dan queue/worker tidak berfungsi.
