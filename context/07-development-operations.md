# 07 Development Operations

## Fullstack Development Workflow

Runtime proyek dipatok ke Bun `1.4.3` lewat `.bun-version`; workflow CI memakai
versi yang sama.

Aplikasi menjalankan dua server di mode pengembangan:
1. **Hono Server (Port 8080)**: Melayani API dan merender halaman JSX (SSR).
2. **Vite Dev Server (Port 5173)**: Melayani Tailwind CSS dan client HMR.

### Development Scripts
- `bun run dev:all`: Menjalankan Hono dan Vite secara bersamaan (disarankan).
- `bun run server:code:dev`: Menjalankan Hono dengan watch mode.
- `bun run dev:css`: Menjalankan Vite untuk Tailwind CSS.
- `bun run build:css`: Mengompilasi Tailwind CSS ke `dist/` dan membuat manifest Vite.
- `bun run typecheck`: Melakukan pengecekan tipe TypeScript di seluruh proyek.
- `bun run server:code:prod`: Menjalankan server dari source dengan env runtime.
- `bun run worker:code:dev`: Menjalankan worker dengan `--watch` saat development.
- `bun run worker:code:prod`: Menjalankan worker dari source dengan env runtime.
- `bun run server:bin` / `bun run worker:bin`: Menjalankan binary dengan `NODE_ENV=production`.

### Migration Scripts
- `bun run migrate`: Run all migrations (menggunakan `.env`)
- `bun run migrate:fresh <target>`: Drop + re-run migrations — target: `sqlite`, `mysql`, `pg`, `mongo`

> Fresh migration **wajib** memilih satu target. `all` akan menghasilkan error untuk mencegah accidental drop semua database.

### Build and Deployment Shape
Build backend dilakukan dengan:
- `bun build ./src/index.ts --compile --outfile server`

Build production perlu menjalankan `bun run build:css` dan menyertakan folder
`dist/` bersama server. Hono membaca `dist/.vite/manifest.json` untuk memilih
stylesheet dan melayani hasil build melalui `/assets/*`.

## Environment Separation

Project memakai **satu file `.env` per mesin** (konvensi ala Laravel):

- Laptop/development: `.env` berisi nilai development (template: `.env.example`)
- Server produksi: `.env` sendiri dengan nilai produksi (`NODE_ENV=production`, host, password, path DB)

`.env` gitignored dan tidak dibagikan antar mesin. Bun memuat `.env` secara
otomatis (native) untuk aplikasi, script CLI (`migrate`, `seed`, `worker`),
`bun test`, dan binary hasil compile — tanpa `--env-file`, tanpa wrapper.
`NODE_ENV` di dalam `.env` dipakai aplikasi code-mode untuk logika runtime
(misal error masking di production). Script binary `server:bin` dan `worker:bin`
menetapkan `NODE_ENV=production`; konfigurasi lain tetap dibaca dari `.env` atau
environment proses.



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

Sekarang ada **13 test files, 84 tests, 178 expect calls** (`bun test`):

| File | Type | Tests |
|------|------|-------|
| `tests/unit/env.test.ts` | Unit — env parser | 13 |
| `tests/unit/errors.test.ts` | Unit — error classes (AppError, NotFoundError, dll) | 14 |
| `tests/unit/response.test.ts` | Unit — response helpers (successResponse, errorResponse) | 4 |
| `tests/unit/logger.test.ts` | Unit — redaksi data sensitif + filter `LOG_LEVEL` | 7 |
| `tests/unit/async.test.ts` | Unit — `withTimeout` | 3 |
| `tests/unit/metrics.test.ts` | Unit — normalisasi path, `kind`, registry metrik | 7 |
| `tests/unit/queue.test.ts` | Unit — propagasi `reqId`, log job, metrik queue (mock bullmq) | 5 |
| `tests/health.test.ts` | Integration — health, readiness, 404 | 5 |
| `tests/integration/web.test.ts` | Integration — landing page, security headers, rate limit headers | 3 |
| `tests/integration/rateLimiter.test.ts` | Integration — rate limit threshold, block, IP isolation | 3 |
| `tests/integration/crud.test.ts` | Integration — CRUD, validasi request, OpenAPI spec + Scalar docs | 12 |
| `tests/integration/observability.test.ts` | Integration — format log request & `CrudService` (spy logger) | 2 |
| `tests/integration/metrics.test.ts` | Integration — `/metrics`, token, label `kind`, cardinality | 6 |

Artinya kondisi saat ini adalah:

- regression safety net mencakup config parsing, error handling, response
  contract, logging, metrics, dan queue
- integration test mencakup CRUD SQLite, OpenAPI spec, health/readiness, dan
  `/metrics`
- propagasi `reqId` ke worker diuji di level unit (mock bullmq)
- verifikasi E2E lintas proses (worker + Redis) masih perlu manual
- refactor fondasi tetap butuh kehati-hatian lebih

## Performance Considerations Visible in Code

Yang terlihat:

- response compression aktif
- SQLite memakai `WAL`
- Redis dipakai untuk cache, queue, dan rate limiter
- queue dan cache default ke `redis1`
- rate limiter memakai Redis per-request (sliding window via `INCR`), fallback memory
- logger memakai WriteStream (buffered) — tidak blocking event loop
- metrics memakai registry in-memory (prom-client) — overhead kecil dan bisa
  dimatikan lewat `METRICS_ENABLED=false`
- log & metrics memakai `requestStartedAt` yang sama sehingga durasinya konsisten

Yang belum terlihat:

- query optimization layer domain
- profiling
- benchmark
- metrik bisnis khusus domain (baru metrik HTTP + queue)

## Security Measures Visible in Code

Yang sudah ada:

- secure headers
- CORS
- JSON-only middleware (mengembalikan HTTP 415 untuk non-JSON POST/PUT/PATCH)
- rate limiting (Redis-based, fallback memory)
- production error masking
- proteksi opsional `/metrics` via shared-secret `METRICS_TOKEN` (header
  `x-metrics-token`)

Yang belum ada:

- authentication
- authorization
- secret rotation strategy
- audit logging
- CSRF discussion, walau ini lebih relevan untuk browser/session model tertentu

## Operational Caveats

- logger menulis ke filesystem via WriteStream (buffered), bukan `appendFileSync`. Namun environment read-only tetap bisa membatasi file logging.
- rate limiter memakai Redis per-request (`INCR` + `PEXPIREAT`), fallback ke in-memory Map jika Redis tidak aktif — akurat antar instance saat Redis aktif.
- worker skeleton sudah tersedia, siap diisi job domain. Worker adalah proses terpisah (`bun run worker:code:prod`).
- type checking kini dapat dieksekusi as-is menggunakan `bun run typecheck` (menjalankan `tsc --noEmit`) yang memastikan strict type safety tanpa intervensi build murni node.
- OpenAPI spec tersedia di `GET /api/spec`, Scalar UI di `GET /api/docs`.
- readiness tersedia di `GET /api/health/ready` (timeout 2 detik per dependency).
- metrics tersedia di `GET /metrics` (aktif via `METRICS_ENABLED`); endpoint ini
  di-exclude dari rate limiter dan request logger.
- **known issue**: metrik queue tercatat di proses worker yang tidak membuka
  HTTP server, sehingga belum bisa di-scrape dari `/metrics` proses API.
