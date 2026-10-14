# Hono Fullstack Skeleton

Skeleton aplikasi Bun + Hono dengan halaman JSX server-rendered, Tailwind CSS v4, named multi-connections database, worker background, migration, dan seeder tooling.

## Features

- Bun runtime
- Hono web framework
- TypeScript
- Hono JSX for Server-Side Rendering (SSR)
- Tailwind CSS v4 compiled by Vite
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
cp .env.example .env
bun run dev:all
```

## Environment Configuration

Project ini memakai **satu file `.env` per mesin** (konvensi ala Laravel):

- Laptop/development: `.env` berisi nilai development (contoh di `.env.example`)
- Server produksi: buat `.env` sendiri dengan nilai produksi (`NODE_ENV=production`, host, password, path DB)

`.env` tidak dibagikan antar mesin (gitignored). Bun otomatis memuat `.env`
saat menjalankan aplikasi, script CLI (`migrate`, `seed`, `worker`), `bun test`,
dan binary hasil compile — tanpa flag atau script tambahan.

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev:all` | Start Hono and the Vite Tailwind CSS server |
| `bun run server:code:dev` | Start Hono backend in watch mode |
| `bun run dev:css` | Start Vite CSS server only |
| `bun run build:css` | Compile Tailwind CSS and write the Vite manifest |
| `bun run typecheck` | Run TypeScript type checking |
| `bun test` | Run all tests (currently **48 tests, 101 expects, 0 fail**) |
| `bun run server:code:prod` | Start Hono using the machine's `.env` and process environment |
| `bun run worker:code:dev` | Start worker in watch mode |
| `bun run worker:code:prod` | Start worker using the machine's `.env` and process environment |
| `bun run migrate` | Run all migrations using `.env` |
| `bun run migrate:fresh <target>` | Drop + re-run migrations for `<target>` (sqlite, mysql, pg, mongo) |
| `bun run seed` | Run all seeders using the active environment |
| `bun run make` | Generate files from local stubs |
| `bun run build` | Compile backend into the `server` binary |
| `bun run server:bin` | Run compiled API binary in production mode; auto-loads `.env` |
| `bun run worker:bin` | Run compiled worker binary in production mode; auto-loads `.env` |

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

- Proyek ini dirancang sebagai fondasi. Halaman `resources/views/example/Index.tsx` menjadi contoh Hono JSX SSR.
- Dukungan database, Redis, cache, queue, migrasi, dan seeding sepenuhnya modular.
- Tailwind CSS dilayani oleh Vite saat development dan dikompilasi ke `dist/` untuk production.
- Worker skeleton tersedia dan siap diisi dengan job domain.
- Semua POST/PUT/PATCH ke `/api/*` **wajib** menyertakan header `Content-Type: application/json` — jika tidak, server mengembalikan HTTP 415.
- Redis **tidak wajib** untuk development (`DB_REDIS_ENABLED=false`). Tanpa Redis, cache dan queue/worker tidak berfungsi.
