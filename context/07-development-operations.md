# 07 Development Operations

## Fullstack Development Workflow

Aplikasi menjalankan dua server di mode pengembangan:
1. **Hono Server (Port 8080)**: Melayani API dan merender HTML awal (SSR).
2. **Vite Dev Server (Port 5173)**: Melayani aset JS/Vue dengan Hot Module Replacement (HMR).

### Development Scripts
- `bun run dev:all`: Menjalankan Hono dan Vite secara bersamaan (disarankan).
- `bun run dev`: Menjalankan Hono (backend).
- `bun run dev:client`: Menjalankan Vite (frontend).
- `bun run build:client`: Membangun aset Vue ke dalam folder `dist/` dan membuat `manifest.json`.
- `bun run typecheck`: Melakukan pengecekan tipe TypeScript di seluruh proyek.
- `bun run prod`: Menjalankan aplikasi di mode produksi.
- `bun run worker:dev`: Menjalankan worker process untuk BullMQ job processing (proses terpisah).

### Migration Scripts
- `bun run migrate:dev`: Run all migrations (`.env.dev`)
- `bun run migrate:fresh:dev <target>`: Drop + re-run migrations — target: `sqlite`, `mysql`, `pg`, `mongo`
- `bun run migrate:fresh:prod <target>`: Same untuk production environment

> Fresh migration **wajib** memilih satu target. `all` akan menghasilkan error untuk mencegah accidental drop semua database.

### Build and Deployment Shape
Build backend dilakukan dengan:
- `bun build ./src/index.ts --compile --outfile server`

Deployment Fullstack memerlukan folder `dist/` (hasil build frontend) agar Hono bisa melayani aset statis dan melakukan fallback SPA.

## Environment Separation

Environment dipisah lewat:

- `.env.dev`
- `.env.prod`
- `.env.example`

Pemisahan ini dipakai langsung di script `bun run --env-file=...`.



## Migration and Seeder Strategy

Migration tooling mendukung:

- MySQL
- PostgreSQL
- MongoDB
- SQLite

Seeder tooling juga tersedia.

Catatan penting:

- SQLite memakai satu folder migration, tetapi setiap file wajib deklarasi target `sqlite1`
- MySQL migration sekarang juga target-aware: `mysql1`
- MongoDB migration sekarang juga target-aware: `mongo1`
- PostgreSQL migration sekarang juga target-aware: `pg1`

## Generator Workflow

CLI generator `scripts/make.ts` dapat membuat:

- migration
- seeder
- controller
- service
- repository
- schema
- job

Ini penting karena modul baru idealnya mengikuti stub repo, bukan ditulis dengan style baru yang tidak sinkron.

## Testing Status

Sekarang ada **7 test files, 48 tests, 101 expect calls** (`bun test`):

| File | Type | Tests |
|------|------|-------|
| `tests/unit/env.test.ts` | Unit — env parser | 13 |
| `tests/unit/errors.test.ts` | Unit — error classes (AppError, NotFoundError, dll) | 14 |
| `tests/unit/response.test.ts` | Unit — response helpers (successResponse, errorResponse) | 4 |
| `tests/health.test.ts` | Integration — health endpoint + 404 | 3 |
| `tests/integration/web.test.ts` | Integration — landing page, security headers, rate limit headers | 2 |
| `tests/integration/rateLimiter.test.ts` | Integration — rate limit threshold, block, IP isolation | 3 |
| `tests/integration/crud.test.ts` | Integration — CRUD endpoints + OpenAPI spec + Scalar docs | 8 |

Artinya kondisi saat ini adalah:

- sudah ada regression safety net untuk config parsing, error handling, dan response contract
- sudah ada integration test untuk database-dependent endpoint (CRUD SQLite + OpenAPI spec)
- manual verification masih penting
- refactor fondasi tetap butuh kehati-hatian lebih

## Performance Considerations Visible in Code

Yang terlihat:

- response compression aktif
- SQLite memakai `WAL`
- Redis dipakai untuk cache, queue, dan rate limiter
- queue dan cache default ke `redis1`
- rate limiter memakai Redis per-request (sliding window via `INCR`), fallback memory
- logger kini memakai WriteStream (buffered) — tidak blocking event loop

Yang belum terlihat:

- query optimization layer domain
- profiling
- metrics
- benchmark

## Security Measures Visible in Code

Yang sudah ada:

- secure headers
- CORS
- JSON-only middleware (mengembalikan HTTP 415 untuk non-JSON POST/PUT/PATCH)
- rate limiting (Redis-based, fallback memory)
- production error masking

Yang belum ada:

- authentication
- authorization
- secret rotation strategy
- audit logging
- CSRF discussion, walau ini lebih relevan untuk browser/session model tertentu

## Operational Caveats

- logger menulis ke filesystem via WriteStream (buffered), bukan `appendFileSync`. Namun environment read-only tetap bisa membatasi file logging.
- rate limiter memakai Redis per-request (`INCR` + `PEXPIREAT`), fallback ke in-memory Map jika Redis tidak aktif — akurat antar instance saat Redis aktif.
- worker skeleton sudah tersedia, siap diisi job domain. Worker adalah proses terpisah (`bun run worker:dev`).
- type checking kini dapat dieksekusi as-is menggunakan `bun run typecheck` (menjalankan `tsc --noEmit`) yang memastikan strict type safety tanpa intervensi build murni node.
- OpenAPI spec tersedia di `GET /api/spec`, Scalar UI di `GET /api/docs`.
