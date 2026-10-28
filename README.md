# Hono Fullstack Skeleton

[![CI](https://github.com/kvanjava1/hono-skeleton-started-kit/actions/workflows/test.yml/badge.svg)](https://github.com/kvanjava1/hono-skeleton-started-kit/actions/workflows/test.yml)
[![Release](https://img.shields.io/github/v/release/kvanjava1/hono-skeleton-started-kit?include_prereleases&label=release)](https://github.com/kvanjava1/hono-skeleton-started-kit/releases)
[![Bun](https://img.shields.io/badge/Bun-1.4.3-black?logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)

Skeleton aplikasi Bun + Hono dengan halaman JSX server-rendered, Tailwind CSS v4, named multi-connections database, worker background, migration, seeder tooling, sistem pengiriman email (Mailable + BullMQ), dan observability lengkap.

## Features

- **Bun Runtime** (pinned di `1.4.3`)
- **Hono Web Framework**
- **TypeScript** dengan strict type safety
- **Hono JSX** untuk Server-Side Rendering (SSR)
- **Tailwind CSS v4** dikompilasi oleh Vite
- **Named Multi-Connections** untuk SQLite, MySQL, MongoDB, Redis, dan PostgreSQL
- **Drizzle ORM** untuk SQL databases (SQLite, MySQL, PostgreSQL)
- **Redis Connection Helpers**, database selector (`REDIS_DB_1`), password & TLS support, serta cache utilities
- **BullMQ** base queue dan worker factory
- **Laravel-Style Mail System**: Mailable class, template responsif Hono JSX, fluent API (`Mail.to().queue()`), multi-driver (`log`, `smtp`, `resend`), dan pengiriman background via BullMQ
- **Migration & Seeder Tooling** dengan target-awareness (`sqlite`, `mysql`, `pg`, `mongo`)
- **Make CLI (Code Generator)** untuk scaffold domain, mailable (`bun run make mail <name>`), controller, service, repository, dll.
- **Modular Middlewares**: Isolasi namespace `api/`, `web/`, dan `common/`
- **File-based Structured JSONL Logging** dengan rotasi harian dan penelusuran `requestId`
- **Health & Readiness Endpoints** (`GET /api/health`, `GET /api/health/ready`)
- **Prometheus Metrics** di `GET /metrics` via `prom-client`
- **OpenAPI 3.0** spec generation otomatis via `@hono/zod-openapi`
- **Scalar API Reference** di `/api/docs` (dokumentasi API interaktif)
- **Content-Type Validation** — mendukung JSON dan `multipart/form-data`, menolak tipe yang tidak didukung dengan HTTP 415
- **Soft Delete Pattern** dengan kolom `deleted_at`
- **Async Job Processing** via BullMQ queue + worker background

## Named Connections

- SQLite: `sqlite1`
- MySQL: `mysql1`
- MongoDB: `mongo1`
- Redis: `redis1`
- PostgreSQL: `pg1`

Compatibility defaults tetap tersedia, namun kode baru disarankan menargetkan nama koneksi secara eksplisit.

## Quick Start

```bash
bun install
cp .env.example .env
bun run dev:all
```

Aplikasi default berjalan di:
- **Hono Server (API & SSR):** `http://localhost:8080`
- **Vite Dev Server (Tailwind CSS HMR):** `http://localhost:5173`
- **Scalar API Docs:** `http://localhost:8080/api/docs`

## Environment Configuration

Project ini memakai **satu file `.env` per mesin** (konvensi ala Laravel):

- Laptop/development: `.env` berisi nilai development (contoh di `.env.example`)
- Server produksi: buat `.env` sendiri dengan nilai produksi (`NODE_ENV=production`, host, password, path DB)

`.env` tidak dibagikan antar mesin (gitignored). Bun otomatis memuat `.env` saat menjalankan aplikasi, script CLI (`migrate`, `seed`, `worker`), `bun test`, dan binary hasil compile — tanpa flag atau script tambahan.

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev:all` | Menjalankan server Hono dan dev server Vite Tailwind CSS bersamaan |
| `bun run server:code:dev` | Menjalankan backend Hono dalam watch mode |
| `bun run dev:css` | Menjalankan dev server Vite untuk CSS saja |
| `bun run build:css` | Mengompilasi Tailwind CSS dan membuat manifest Vite ke `public/build/` |
| `bun run typecheck` | Menjalankan TypeScript type check (`tsc --noEmit`) |
| `bun test` | Menjalankan test suite (saat ini **120 tests, 267 expects, 0 fail**) |
| `bun run server:code:prod` | Menjalankan server Hono dari source dengan env runtime |
| `bun run worker:code:dev` | Menjalankan BullMQ worker dalam watch mode |
| `bun run worker:code:prod` | Menjalankan BullMQ worker dari source dengan env runtime |
| `bun run migrate` | Menjalankan migrasi database aktif menggunakan `.env` |
| `bun run migrate:fresh <target>` | Drop + re-run migrasi untuk `<target>` (`sqlite`, `mysql`, `pg`, `mongo`) |
| `bun run seed` | Menjalankan seeder database menggunakan environment aktif |
| `bun run make` | Generator kode modular (domain, controller, service, repository, dll) |
| `bun run build:app` | Meng-compile backend menjadi binary mandiri `./server` |
| `bun run server:bin:prod` | Menjalankan binary `./server` dalam mode API production |
| `bun run worker:bin:prod` | Menjalankan binary `./server --worker` dalam mode Worker production |

## Default Endpoints

### Health & Observability

```http
GET /api/health        # Liveness check (uptime & timestamp)
GET /api/health/ready  # Readiness check (memeriksa konektivitas database yang aktif)
GET /metrics           # Prometheus metrics (aktif jika METRICS_ENABLED=true)
```

### OpenAPI Documentation

```http
GET /api/spec          # OpenAPI 3.0 JSON spec
GET /api/docs          # Scalar API Reference (UI interaktif)
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
| POST | `/api/example/cruds/send-email` | Enqueue example welcome email via BullMQ |

## Documentation

Dokumentasi lengkap terpusat di folder [`docs/`](./docs/README.md):
- [Getting Started](./docs/getting-started/README.md) (Instalasi & Deployment)
- [Guides](./docs/guides/README.md) (Migrasi, Seeder, Logging, Queues, Mail System, Make CLI, Metrics)
- [Standards](./docs/standards/README.md) (Arsitektur, Konvensi, Error Handling, API Patterns)
- [Reference](./docs/reference/README.md) (Architecture Overview, Connection Model)

## Notes

- Proyek ini dirancang sebagai fondasi. Halaman `resources/views/example/Index.tsx` menjadi contoh Hono JSX SSR.
- Dukungan database, Redis, cache, queue, migrasi, dan seeding sepenuhnya modular.
- Tailwind CSS dilayani oleh Vite saat development dan dikompilasi ke `public/build/` untuk production.
- Worker skeleton tersedia dan siap diisi dengan job domain.
- Endpoint POST/PUT/PATCH ke `/api/*` mendukung format `application/json` dan `multipart/form-data` (request dengan tipe yang tidak didukung akan mengembalikan HTTP 415).
- Redis **tidak wajib** untuk development dasar (`DB_REDIS_ENABLED=false`). Tanpa Redis, cache dan queue/worker tidak berfungsi.
